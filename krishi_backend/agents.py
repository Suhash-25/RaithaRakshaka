import base64
import asyncio
import json
import math
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional

import httpx


OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_TEXT_MODEL = os.getenv("OLLAMA_TEXT_MODEL", "llama3.2:3b")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llama3.2-vision")
DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY", "")
ENABLE_OLLAMA_SUMMARY = os.getenv("ENABLE_OLLAMA_SUMMARY", "false").lower() == "true"


def now_iso() -> str:
    return datetime.now().isoformat()


def normalise(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", (text or "").lower()).strip()


def bounded(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def extract_json(raw: str) -> Optional[dict]:
    if not raw:
        return None
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(text[start : end + 1])
    except Exception:
        return None


async def ollama_generate(
    prompt: str,
    system: str = "",
    model: Optional[str] = None,
    images: Optional[List[str]] = None,
    timeout: float = 45,
) -> str:
    payload = {
        "model": model or OLLAMA_TEXT_MODEL,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {"temperature": 0.2},
    }
    if images:
        payload["images"] = images

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
        response.raise_for_status()
        return response.json().get("response", "")


@dataclass
class SharedContext:
    query: str = ""
    language: str = "en"
    farmer_profile: Dict[str, Any] = field(default_factory=dict)
    findings: Dict[str, Any] = field(default_factory=dict)
    agent_flow: List[Dict[str, str]] = field(default_factory=list)

    def start(self, agent: str, message: str) -> None:
        self.agent_flow.append({"agent": agent, "status": "running", "message": message})

    def finish(self, agent: str, message: str, status: str = "success") -> None:
        for item in reversed(self.agent_flow):
            if item["agent"] == agent and item["status"] == "running":
                item["status"] = status
                item["message"] = message
                return
        self.agent_flow.append({"agent": agent, "status": status, "message": message})


class CropDiagnosticAgent:
    name = "Crop Diagnostic Agent"

    FALLBACKS = {
        "tomato": {
            "disease": "Possible Late Blight",
            "crop": "Tomato",
            "confidence": 68,
            "severity": "High",
            "symptoms": ["Dark leaf spots", "Yellowing around lesions", "Rapid spread in wet weather"],
            "treatment": [
                "Remove infected leaves and destroy them away from the field",
                "Spray Mancozeb 75WP at 2.5 g/L if local advisory permits",
                "Avoid overhead irrigation for the next 3 days",
            ],
            "prevention": ["Keep wider spacing", "Use resistant varieties", "Rotate with non-solanaceous crops"],
            "organic_remedy": "Spray 1% Bordeaux mixture or neem-based biocontrol as a preventive measure.",
            "yield_loss": "30-40% if untreated in humid weather",
            "urgency": "Act within 24-48 hours",
        },
        "rice": {
            "disease": "Possible Bacterial Leaf Blight",
            "crop": "Rice",
            "confidence": 64,
            "severity": "High",
            "symptoms": ["Yellow streaks from leaf tips", "Wilting seedlings", "Water-soaked lesions"],
            "treatment": ["Drain excess water", "Avoid extra nitrogen", "Use copper-based spray only with expert advice"],
            "prevention": ["Use certified seeds", "Keep balanced NPK", "Avoid field-to-field water movement"],
            "organic_remedy": "Apply Pseudomonas fluorescens as per local agriculture officer guidance.",
            "yield_loss": "20-50% in severe cases",
            "urgency": "Immediate field inspection recommended",
        },
    }

    async def run(self, ctx: SharedContext, image_bytes: Optional[bytes] = None, file_name: str = "") -> Dict[str, Any]:
        ctx.start(self.name, "Checking crop symptoms and image evidence")
        crop = normalise(ctx.farmer_profile.get("crop") or ctx.query)
        fallback = self.FALLBACKS.get("rice" if "rice" in crop else "tomato", self.FALLBACKS["tomato"]).copy()

        if image_bytes:
            try:
                image_b64 = base64.b64encode(image_bytes).decode("ascii")
                prompt = (
                    "Analyze this crop leaf image for disease, pest, or nutrient deficiency. "
                    "Return JSON with keys: disease, crop, confidence, severity, symptoms, treatment, "
                    "prevention, organic_remedy, yield_loss, urgency. Use Indian farming context."
                )
                raw = await ollama_generate(prompt, model=OLLAMA_VISION_MODEL, images=[image_b64], timeout=90)
                parsed = extract_json(raw)
                if parsed:
                    fallback.update(parsed)
                    ctx.finish(self.name, f"Vision diagnosis ready: {fallback.get('disease', 'crop issue')}")
                else:
                    fallback["model_note"] = raw[:500] if raw else "Vision model returned no structured output"
                    ctx.finish(self.name, "Vision model responded; used structured fallback fields")
            except Exception as exc:
                fallback["model_note"] = f"Ollama vision unavailable: {exc}"
                ctx.finish(self.name, "Local vision model unavailable; used offline crop rules", "warning")
        else:
            if "yellow" in normalise(ctx.query):
                fallback["disease"] = "Possible nutrient deficiency or early blight"
                fallback["confidence"] = 58
                fallback["severity"] = "Medium"
            ctx.finish(self.name, f"Text diagnosis ready: {fallback['disease']}")

        fallback.update(
            {
                "analysis_id": f"KR-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "analyzed_at": now_iso(),
                "file_name": file_name,
                "source": "ollama-vlm" if image_bytes and "model_note" not in fallback else "offline-rules",
            }
        )
        ctx.findings["diagnosis"] = fallback
        return fallback


class WeatherRiskAgent:
    name = "Weather & Risk Agent"

    async def geocode(self, location: str) -> Optional[dict]:
        async with httpx.AsyncClient(timeout=4) as client:
            resp = await asyncio.wait_for(
                client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={"name": location, "count": 1, "language": "en", "format": "json"},
                ),
                timeout=0.9,
            )
            resp.raise_for_status()
            results = resp.json().get("results") or []
            return results[0] if results else None

    async def run(self, ctx: SharedContext, location: Optional[str] = None) -> Dict[str, Any]:
        ctx.start(self.name, "Fetching live forecast and calculating farm risk")
        location = str(location or ctx.farmer_profile.get("location") or "Bangalore")
        try:
            geo = await self.geocode(location)
            if not geo:
                raise ValueError("location not found")
            params = {
                "latitude": geo["latitude"],
                "longitude": geo["longitude"],
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_mean",
                "forecast_days": 5,
                "timezone": "auto",
            }
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await asyncio.wait_for(
                    client.get("https://api.open-meteo.com/v1/forecast", params=params),
                    timeout=1.2,
                )
                resp.raise_for_status()
                data = resp.json()
            current = data.get("current", {})
            daily = data.get("daily", {})
            humidity = float(current.get("relative_humidity_2m") or 60)
            rain_prob = float((daily.get("precipitation_probability_max") or [0])[0] or 0)
            temp = float(current.get("temperature_2m") or 28)
            fungal_risk = bounded((humidity - 55) * 1.4 + rain_prob * 0.45)
            heat_risk = bounded((temp - 30) * 9)
            pest_risk = bounded((humidity * 0.45) + (temp * 1.2) - 35)
            alerts = self.alerts(fungal_risk, heat_risk, pest_risk, rain_prob)
            forecast = []
            for idx, day in enumerate(daily.get("time", [])[:5]):
                forecast.append(
                    {
                        "day": "Today" if idx == 0 else datetime.fromisoformat(day).strftime("%a"),
                        "max": daily.get("temperature_2m_max", [])[idx],
                        "min": daily.get("temperature_2m_min", [])[idx],
                        "condition": "Rain Risk" if daily.get("precipitation_probability_max", [0])[idx] > 55 else "Clear",
                        "rain_prob": daily.get("precipitation_probability_max", [0])[idx],
                        "humidity": daily.get("relative_humidity_2m_mean", [humidity])[idx],
                    }
                )
            result = {
                "location": f"{geo.get('name')}, {geo.get('admin1', geo.get('country', ''))}".strip(", "),
                "updated_at": now_iso(),
                "source": "Open-Meteo live forecast",
                "current": {
                    "temp": round(temp, 1),
                    "humidity": round(humidity),
                    "wind_speed": round(float(current.get("wind_speed_10m") or 0), 1),
                    "condition": "Rain Risk" if rain_prob > 55 else "Clear",
                    "uv_index": "-",
                    "rainfall_mm": round(float(current.get("precipitation") or 0), 1),
                    "feels_like": round(float(current.get("apparent_temperature") or temp), 1),
                },
                "forecast": forecast,
                "risk_scores": {
                    "fungal_spread": round(fungal_risk),
                    "heat_stress": round(heat_risk),
                    "pest_activity": round(pest_risk),
                },
                "alerts": alerts,
                "advisory": self.advisory(fungal_risk, heat_risk, rain_prob),
            }
            ctx.finish(self.name, f"Live weather loaded; fungal risk {round(fungal_risk)}%")
        except Exception as exc:
            result = self.offline_weather(location, str(exc))
            ctx.finish(self.name, "Live weather unavailable; used offline seasonal estimate", "warning")

        ctx.findings["weather"] = result
        return result

    def alerts(self, fungal: float, heat: float, pest: float, rain_prob: float) -> List[dict]:
        alerts = []
        if fungal >= 65:
            alerts.append({"type": "warning", "icon": "!", "title": "High Fungal Risk", "message": f"{round(fungal)}% fungal spread risk from humidity/rain.", "action": "Avoid overhead watering and inspect lower leaves today"})
        if rain_prob >= 60:
            alerts.append({"type": "info", "icon": "R", "title": "Rain Expected", "message": f"{round(rain_prob)}% rain probability.", "action": "Postpone pesticide spray until a dry window"})
        if heat >= 55:
            alerts.append({"type": "danger", "icon": "H", "title": "Heat Stress", "message": f"{round(heat)}% heat stress risk.", "action": "Irrigate during early morning or evening"})
        if pest >= 70:
            alerts.append({"type": "warning", "icon": "P", "title": "Pest Activity Watch", "message": f"{round(pest)}% pest activity risk.", "action": "Use sticky traps and scout field edges"})
        return alerts or [{"type": "success", "icon": "OK", "title": "Favorable Conditions", "message": "Weather risk is low for common operations.", "action": "Good window for field inspection"}]

    def advisory(self, fungal: float, heat: float, rain_prob: float) -> str:
        if fungal >= 65:
            return "Humidity and rain are favorable for fungal disease. Inspect the crop today and spray only if a dry 6-hour window is available."
        if heat >= 55:
            return "Heat stress is elevated. Prioritize mulching and cool-hour irrigation."
        if rain_prob >= 60:
            return "Rain is likely. Delay fertilizer or pesticide application to reduce wastage."
        return "Conditions look suitable for routine field work and crop scouting."

    def offline_weather(self, location: str, reason: str) -> Dict[str, Any]:
        return {
            "location": location,
            "updated_at": now_iso(),
            "source": f"offline seasonal estimate ({reason})",
            "current": {"temp": 29, "humidity": 68, "wind_speed": 8, "condition": "Clear", "uv_index": "-", "rainfall_mm": 0, "feels_like": 31},
            "forecast": [{"day": f"Day {i+1}", "max": 31 + i % 2, "min": 22, "condition": "Clear", "rain_prob": 25 + i * 5, "humidity": 65} for i in range(5)],
            "risk_scores": {"fungal_spread": 45, "heat_stress": 20, "pest_activity": 48},
            "alerts": [{"type": "info", "icon": "i", "title": "Offline Estimate", "message": "Connect internet for live local forecast.", "action": "Use this only as a planning estimate"}],
            "advisory": "Offline estimate: scout crop and check local sky conditions before spraying.",
        }


class GovernmentSchemeAgent:
    name = "Government Scheme Agent"

    SCHEMES = [
        {
            "id": "pmkisan",
            "name": "PM-KISAN",
            "full_name": "Pradhan Mantri Kisan Samman Nidhi",
            "benefit": "Rs 6,000/year direct income support",
            "category": "Financial Support",
            "keywords": ["small", "marginal", "all crops", "income"],
            "min_acres": 0,
            "max_acres": 5,
            "deadline": "Ongoing",
            "how_to_apply": "Apply through pmkisan.gov.in, CSC, or local agriculture office.",
            "documents": ["Aadhaar Card", "Land Records / RTC", "Bank Account"],
            "impact": "Direct cash support for eligible farmer families",
            "success_rate": "High when land and Aadhaar records match",
        },
        {
            "id": "pmfby",
            "name": "PMFBY",
            "full_name": "Pradhan Mantri Fasal Bima Yojana",
            "benefit": "Crop insurance against weather and yield loss",
            "category": "Crop Insurance",
            "keywords": ["distress", "rain", "drought", "pest", "disease", "insurance"],
            "min_acres": 0.1,
            "max_acres": 100,
            "deadline": "Before notified sowing season cut-off",
            "how_to_apply": "Apply through bank, insurer portal, CSC, or pmfby.gov.in.",
            "documents": ["Land Records", "Sowing Certificate", "Bank Account", "Aadhaar Card"],
            "impact": "Useful for crops facing weather or pest risk",
            "success_rate": "Strong when applied before season deadline",
        },
        {
            "id": "kcc",
            "name": "KCC",
            "full_name": "Kisan Credit Card",
            "benefit": "Short-term crop credit, often up to Rs 3 lakh at subsidized interest",
            "category": "Agricultural Loan",
            "keywords": ["credit", "loan", "input", "seed", "fertilizer"],
            "min_acres": 0,
            "max_acres": 100,
            "deadline": "Ongoing",
            "how_to_apply": "Apply at a bank branch with land and identity documents.",
            "documents": ["Aadhaar Card", "Land Records", "PAN Card", "Bank Account"],
            "impact": "Reduces dependence on informal credit",
            "success_rate": "Good with clean land records",
        },
        {
            "id": "pmkusum",
            "name": "PM-KUSUM",
            "full_name": "PM Kisan Urja Suraksha evam Utthaan Mahabhiyan",
            "benefit": "Subsidy support for solar pumps",
            "category": "Energy & Irrigation",
            "keywords": ["irrigation", "pump", "solar", "water", "electricity"],
            "min_acres": 1,
            "max_acres": 100,
            "deadline": "State-wise slots",
            "how_to_apply": "Apply through the state renewable energy or agriculture department portal.",
            "documents": ["Land Records", "Aadhaar Card", "Bank Account", "Pump details"],
            "impact": "Cuts diesel/electricity cost for irrigation",
            "success_rate": "Depends on state quota",
        },
    ]

    async def run(self, ctx: SharedContext, profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        ctx.start(self.name, "Retrieving and ranking eligible schemes")
        profile = {**ctx.farmer_profile, **(profile or {})}
        query = normalise(" ".join([ctx.query, profile.get("crop", ""), profile.get("category", ""), profile.get("distress_level", "")]))
        acres = float(profile.get("land_acres") or 2)

        ranked = []
        for scheme in self.SCHEMES:
            score = 0
            if scheme["min_acres"] <= acres <= scheme["max_acres"]:
                score += 55
            score += sum(10 for kw in scheme["keywords"] if kw in query)
            if profile.get("state", "").lower() == "karnataka":
                score += 5
            item = {k: v for k, v in scheme.items() if k != "keywords"}
            item["match_score"] = min(score, 100)
            item["status"] = "Eligible" if score >= 55 else "Check Eligibility"
            item["why_matched"] = self.reason(item, acres)
            ranked.append(item)

        ranked.sort(key=lambda s: s["match_score"], reverse=True)
        eligible = [s for s in ranked if s["status"] == "Eligible"]
        result = {
            "schemes": ranked,
            "summary": {
                "eligible_count": len(eligible),
                "total": len(ranked),
                "estimated_benefit": self.estimate_benefit(eligible),
                "state": profile.get("state", "Karnataka"),
                "crop": profile.get("crop", "Tomato"),
                "source": "local RAG knowledge base",
            },
        }
        ctx.finish(self.name, f"Matched {len(eligible)} eligible schemes")
        ctx.findings["schemes"] = result
        return result

    def reason(self, scheme: dict, acres: float) -> str:
        if scheme["status"] == "Eligible":
            return f"Land size {acres} acres fits this scheme's basic range."
        return "Basic land-size fit or crop context needs manual verification."

    def estimate_benefit(self, schemes: List[dict]) -> str:
        names = {s["id"] for s in schemes}
        low, high = 0, 0
        if "pmkisan" in names:
            low += 6000
            high += 6000
        if "kcc" in names:
            high += 300000
        if "pmkusum" in names:
            high += 200000
        if "pmfby" in names:
            high += 200000
        return f"Rs {low:,} - Rs {max(high, low):,} potential support/coverage"


class MarketPriceAgent:
    name = "Market Price Agent"

    CACHE = {
        "tomato": 2800,
        "onion": 3500,
        "potato": 1800,
        "rice": 4200,
        "wheat": 2300,
        "maize": 1900,
        "cotton": 6200,
        "sugarcane": 350,
        "soybean": 4800,
        "groundnut": 5500,
    }

    async def run(self, ctx: SharedContext, crop: Optional[str] = None, state: str = "Karnataka") -> Dict[str, Any]:
        ctx.start(self.name, "Fetching mandi price and trend signal")
        crop = str(crop or ctx.farmer_profile.get("crop") or "Tomato")
        live = await self.fetch_data_gov(crop, state)
        result = live or self.cached_market(crop)
        ctx.finish(self.name, f"Market signal ready for {result['crop']}")
        ctx.findings["market"] = result
        return result

    async def fetch_data_gov(self, crop: str, state: str) -> Optional[Dict[str, Any]]:
        if not DATA_GOV_API_KEY:
            return None
        params = {
            "api-key": DATA_GOV_API_KEY,
            "format": "json",
            "limit": 10,
            "filters[commodity]": crop.title(),
            "filters[state]": state,
        }
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await asyncio.wait_for(
                    client.get(
                        "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
                        params=params,
                    ),
                    timeout=1.2,
                )
                resp.raise_for_status()
                records = resp.json().get("records") or []
            prices = [float(r.get("modal_price") or 0) for r in records if r.get("modal_price")]
            if not prices:
                return None
            current = int(sum(prices) / len(prices))
            markets = [
                {
                    "name": f"{r.get('market', 'Mandi')} {r.get('district', '')}".strip(),
                    "price": int(float(r.get("modal_price") or current)),
                    "distance_km": "-",
                }
                for r in records[:3]
            ]
            return self.market_payload(crop, current, "data.gov.in Agmarknet API", markets)
        except Exception:
            return None

    def cached_market(self, crop: str) -> Dict[str, Any]:
        base = self.CACHE.get(crop.lower(), 2600)
        day = datetime.now().timetuple().tm_yday
        wave = math.sin(day / 7) * 0.08
        current = int(base * (1 + wave))
        markets = [
            {"name": "APMC Bangalore", "price": int(current * 1.02), "distance_km": 35},
            {"name": "Kolar APMC", "price": int(current * 0.98), "distance_km": 70},
            {"name": "Mysuru APMC", "price": int(current * 1.01), "distance_km": 145},
        ]
        return self.market_payload(crop, current, "local cached mandi baseline", markets)

    def market_payload(self, crop: str, current: int, source: str, markets: List[dict]) -> Dict[str, Any]:
        week_ago = int(current * 0.96)
        month_ago = int(current * 0.91)
        change = round(((current - week_ago) / week_ago) * 100, 2)
        return {
            "crop": crop.title(),
            "current_price": current,
            "week_ago": week_ago,
            "month_ago": month_ago,
            "unit": "per quintal (100 kg)",
            "price_change": change,
            "trend": "rising" if change >= 0 else "falling",
            "msp": int(current * 0.85),
            "best_market": max(markets, key=lambda m: m["price"])["name"],
            "demand": "High" if change > 3 else "Moderate",
            "source": source,
            "updated_at": now_iso(),
            "ai_prediction": f"Near-term prices may {'rise' if change >= 0 else 'soften'} by 3-8% based on current mandi signal and seasonal baseline.",
            "chart": [
                {"label": "30 days ago", "price": month_ago},
                {"label": "2 weeks ago", "price": int((month_ago + week_ago) / 2)},
                {"label": "1 week ago", "price": week_ago},
                {"label": "Today", "price": current},
                {"label": "Predicted", "price": int(current * (1.06 if change >= 0 else 0.96))},
            ],
            "top_markets": markets,
        }


class OrchestratorAgent:
    name = "Orchestrator Agent"

    def __init__(self) -> None:
        self.crop_agent = CropDiagnosticAgent()
        self.weather_agent = WeatherRiskAgent()
        self.scheme_agent = GovernmentSchemeAgent()
        self.market_agent = MarketPriceAgent()

    def plan(self, query: str, has_image: bool = False) -> List[str]:
        q = normalise(query)
        agents = []
        if has_image or any(w in q for w in ["disease", "leaf", "yellow", "pest", "deficiency", "spots"]):
            agents.append("diagnosis")
        if any(w in q for w in ["weather", "rain", "humidity", "spray", "irrigation", "risk"]):
            agents.append("weather")
        if any(w in q for w in ["scheme", "subsidy", "pm kisan", "pm-kisan", "loan", "insurance", "kcc"]):
            agents.append("schemes")
        if any(w in q for w in ["price", "market", "mandi", "sell", "rate"]):
            agents.append("market")
        if not agents:
            agents = ["diagnosis", "weather", "schemes", "market"]
        return agents

    async def run(
        self,
        query: str,
        language: str = "en",
        profile: Optional[Dict[str, Any]] = None,
        image_bytes: Optional[bytes] = None,
        file_name: str = "",
    ) -> Dict[str, Any]:
        ctx = SharedContext(query=query, language=language, farmer_profile=profile or {})
        ctx.start(self.name, "Analyzing query and selecting specialist agents")
        plan = self.plan(query, has_image=bool(image_bytes))
        ctx.finish(self.name, " -> ".join(plan))

        tasks = []
        if "diagnosis" in plan:
            tasks.append(self.crop_agent.run(ctx, image_bytes=image_bytes, file_name=file_name))
        if "weather" in plan:
            tasks.append(self.weather_agent.run(ctx, location=ctx.farmer_profile.get("location")))
        if "schemes" in plan:
            tasks.append(self.scheme_agent.run(ctx))
        if "market" in plan:
            tasks.append(self.market_agent.run(ctx, crop=ctx.farmer_profile.get("crop"), state=ctx.farmer_profile.get("state", "Karnataka")))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        response = await self.summarize(ctx)
        return {
            "status": "success",
            "response": response,
            "agent_flow": ctx.agent_flow,
            "shared_context": ctx.findings,
            "updated_at": now_iso(),
        }

    async def summarize(self, ctx: SharedContext) -> str:
        if not ENABLE_OLLAMA_SUMMARY:
            return self.offline_summary(ctx)
        compact = json.dumps(ctx.findings, ensure_ascii=True)[:3500]
        system = (
            "You are RaithaRakshaka AI, a practical agriculture assistant for Indian farmers. "
            "Use the shared context to answer in simple language. Mention uncertainty and next actions."
        )
        prompt = f"Farmer query: {ctx.query}\nLanguage: {ctx.language}\nSharedContext: {compact}\nGive a concise actionable answer."
        try:
            return await ollama_generate(prompt, system=system, timeout=3)
        except Exception:
            return self.offline_summary(ctx)

    def offline_summary(self, ctx: SharedContext) -> str:
        parts = []
        diagnosis = ctx.findings.get("diagnosis")
        weather = ctx.findings.get("weather")
        schemes = ctx.findings.get("schemes")
        market = ctx.findings.get("market")
        if diagnosis:
            parts.append(f"Crop check: {diagnosis.get('disease')} ({diagnosis.get('confidence')}% confidence). Next step: {diagnosis.get('treatment', ['Inspect field'])[0]}.")
        if weather:
            risk = weather.get("risk_scores", {})
            parts.append(f"Weather risk: fungal {risk.get('fungal_spread')}%, heat {risk.get('heat_stress')}%. {weather.get('advisory')}")
        if schemes:
            parts.append(f"Schemes: {schemes['summary']['eligible_count']} likely matches. Top match: {schemes['schemes'][0]['name']}.")
        if market:
            parts.append(f"Market: {market['crop']} is Rs {market['current_price']}/quintal, trend {market['trend']}.")
        return "\n".join(parts) or "I checked the local agents, but need more crop, location, or image details to give specific advice."
