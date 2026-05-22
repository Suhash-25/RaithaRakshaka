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
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_TEXT_MODEL = os.getenv("OLLAMA_TEXT_MODEL", "llama3.2:3b")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llama3.2-vision")
DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY", "")
ENABLE_OLLAMA_SUMMARY = os.getenv("ENABLE_OLLAMA_SUMMARY", "false").lower() == "true"
ENABLE_LIVE_AI = os.getenv("ENABLE_LIVE_AI", "true").lower() == "true"
ENABLE_TAVILY_SEARCH = os.getenv("ENABLE_TAVILY_SEARCH", "true").lower() == "true"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

MASTER_SYSTEM_PROMPT = """
You are the core AI engine for RaithaRakshak AI, a real-time farmer welfare and rural intelligence platform.
You are an agriculture intelligence assistant, geospatial analyst, crop advisor, market assistant, scheme advisor,
weather-aware farming assistant, and rural support AI.

Critical rules:
- Never give generic or static answers when live tools/context are available.
- Never invent weather, scheme, soil, map, or market data.
- Always use the SharedContext findings from specialist agents before answering.
- Always adapt to crop, location, weather, land, market, scheme, and timestamp context.
- If crop or location is required but missing, ask one short clarification instead of guessing.
- If a data source fails, say so briefly and do not replace it with fake values.

Response style:
- Farmer-friendly, practical, concise.
- Include live source/timestamp when data is present.
- Give next actions, not textbook explanations.
""".strip()


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


async def live_ai_generate(prompt: str, system: str = "", timeout: float = 8) -> str:
    errors: List[str] = []
    if GROQ_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.25,
                        "max_tokens": 650,
                    },
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except Exception as exc:
            errors.append(f"Groq unavailable: {type(exc).__name__}")

    if OPENROUTER_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5173",
                        "X-Title": "RaithaRakshaka AI",
                    },
                    json={
                        "model": os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free"),
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.25,
                        "max_tokens": 650,
                    },
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except Exception as exc:
            errors.append(f"OpenRouter unavailable: {type(exc).__name__}")

    raise RuntimeError("; ".join(errors) or "No live AI provider configured")


async def tavily_search(query: str, timeout: float = 5) -> List[Dict[str, str]]:
    if not ENABLE_TAVILY_SEARCH or not TAVILY_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": TAVILY_API_KEY,
                    "query": query,
                    "search_depth": "basic",
                    "max_results": 4,
                    "include_answer": True,
                },
            )
            response.raise_for_status()
            data = response.json()
        results = data.get("results") or []
        compact = [
            {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", "")[:450],
            }
            for item in results
        ]
        if data.get("answer"):
            compact.insert(0, {"title": "Tavily synthesis", "url": "", "content": data["answer"][:450]})
        return compact[:4]
    except Exception:
        return []


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
        async with httpx.AsyncClient(timeout=6) as client:
            resp = await asyncio.wait_for(
                client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={"name": location, "count": 1, "language": "en", "format": "json"},
                ),
                timeout=3.0,
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
            async with httpx.AsyncClient(timeout=8) as client:
                resp = await asyncio.wait_for(
                    client.get("https://api.open-meteo.com/v1/forecast", params=params),
                    timeout=4.0,
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
        state = profile.get("state") or profile.get("location") or "Karnataka"
        crop = profile.get("crop") or "farmer"

        live_sources = []
        if ENABLE_TAVILY_SEARCH:
            ctx.start("Scheme Search Agent", "Searching live government and agriculture scheme sources")
            search_query = (
                f"{state} {crop} farmer subsidy scheme irrigation crop insurance equipment agriculture 2026"
            )
            live_sources = await tavily_search(search_query, timeout=5)
            if not live_sources and "irrigation" in query:
                live_sources = await tavily_search(f"PMKSY drip irrigation subsidy {state} {crop} farmers", timeout=5)
            ctx.findings["scheme_web_sources"] = live_sources
            ctx.finish(
                "Scheme Search Agent",
                f"Found {len(live_sources)} live scheme references" if live_sources else "No live scheme references returned",
                "success" if live_sources else "warning",
            )

        ranked = []
        for scheme in self.SCHEMES:
            score = 0
            if scheme["min_acres"] <= acres <= scheme["max_acres"]:
                score += 55
            score += sum(10 for kw in scheme["keywords"] if kw in query)
            if str(profile.get("state", "")).lower() == "karnataka":
                score += 5
            if live_sources and any(normalise(s.get("content", "")) and any(kw in normalise(s.get("content", "")) for kw in scheme["keywords"]) for s in live_sources):
                score += 10
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
                "state": state,
                "crop": crop,
                "source": "local RAG knowledge base + live Tavily scheme search" if live_sources else "local RAG knowledge base",
                "live_sources": live_sources,
                "updated_at": now_iso(),
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

    FILTER_CACHE: Dict[str, Any] = {"created_at": None, "data": None}
    REPORT_CACHE: Dict[str, Any] = {}
    COMMON_COMMODITIES = {
        "tomato": {"cmdt_id": 65, "cmdt_name": "Tomato", "cmdt_group_id": 6},
        "onion": {"cmdt_id": 23, "cmdt_name": "Onion", "cmdt_group_id": 6},
        "potato": {"cmdt_id": 24, "cmdt_name": "Potato", "cmdt_group_id": 6},
        "rice": {"cmdt_id": 3, "cmdt_name": "Rice", "cmdt_group_id": 1},
        "paddy": {"cmdt_id": 3, "cmdt_name": "Rice", "cmdt_group_id": 1},
        "wheat": {"cmdt_id": 1, "cmdt_name": "Wheat", "cmdt_group_id": 1},
        "maize": {"cmdt_id": 4, "cmdt_name": "Maize", "cmdt_group_id": 1},
        "cotton": {"cmdt_id": 15, "cmdt_name": "Cotton", "cmdt_group_id": 4},
        "groundnut": {"cmdt_id": 10, "cmdt_name": "Groundnut", "cmdt_group_id": 3},
    }
    COMMON_STATES = {"karnataka": 16}
    LOCATION_ALIASES = {
        "mysuru": ["mysore"],
        "mysore": ["mysuru"],
        "bengaluru": ["bangalore"],
        "bangalore": ["bengaluru"],
        "hubballi": ["hubli"],
        "hubli": ["hubballi"],
        "belgaum": ["belagavi"],
        "belagavi": ["belgaum"],
        "tumakuru": ["tumkur"],
        "tumkur": ["tumakuru"],
        "shivamogga": ["shimoga"],
        "shimoga": ["shivamogga"],
        "chikkaballapur": ["chikkaballapura", "chikballapur", "chik ballapur"],
        "chikkaballapura": ["chikkaballapur", "chikballapur", "chik ballapur"],
    }
    AGMARKNET_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        "Origin": "https://agmarknet.gov.in",
        "Referer": "https://agmarknet.gov.in/daily-price-and-arrival-report",
        "Accept": "application/json, text/plain, */*",
    }

    async def run(
        self,
        ctx: SharedContext,
        crop: Optional[str] = None,
        state: str = "Karnataka",
        location: Optional[str] = None,
        district: Optional[str] = None,
        mandi: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> Dict[str, Any]:
        ctx.start(self.name, "Fetching mandi price and trend signal")
        crop = str(crop or ctx.farmer_profile.get("crop") or "Tomato")
        district = district or ctx.farmer_profile.get("district")
        location = location or district or ctx.farmer_profile.get("location") or state
        live = await self.fetch_agmarknet(crop, state, location, district=district, mandi=mandi)
        if not live:
            live = await self.fetch_data_gov(crop, state, district=district or location, mandi=mandi)
        result = live or self.unavailable_market(crop, location=location, state=state, district=district or location)
        status = "success" if live else "warning"
        message = f"Live mandi signal ready for {result['crop']}" if live else "Live mandi feed unavailable"
        ctx.finish(self.name, message, status)
        ctx.findings["market"] = result
        return result

    async def fetch_agmarknet_filters(self) -> Optional[Dict[str, Any]]:
        created_at = self.FILTER_CACHE.get("created_at")
        if created_at and datetime.now() - created_at < timedelta(hours=6):
            return self.FILTER_CACHE.get("data")
        try:
            for _ in range(2):
                try:
                    async with httpx.AsyncClient(timeout=30, headers=self.AGMARKNET_HEADERS) as client:
                        resp = await client.get("https://api.agmarknet.gov.in/v1/daily-price-arrival/filters")
                        resp.raise_for_status()
                        payload = resp.json()
                    data = payload.get("data") or {}
                    self.FILTER_CACHE = {"created_at": datetime.now(), "data": data}
                    return data
                except Exception:
                    await asyncio.sleep(0.4)
        except Exception:
            pass
        return self.FILTER_CACHE.get("data")

    def resolve_commodity(self, filters: Dict[str, Any], crop: str) -> Optional[Dict[str, Any]]:
        crop_norm = normalise(crop)
        aliases = {
            "paddy": "rice",
            "corn": "maize",
            "chilli": "green chilli",
            "sugar cane": "sugarcane",
        }
        target = aliases.get(crop_norm, crop_norm)
        if not filters and target in self.COMMON_COMMODITIES:
            return self.COMMON_COMMODITIES[target]
        if not filters:
            return None
        commodities = filters.get("cmdt_data") or []
        exact = [c for c in commodities if normalise(c.get("cmdt_name")) == target]
        if exact:
            return exact[0]
        starts = [c for c in commodities if normalise(c.get("cmdt_name")).startswith(target)]
        if starts:
            return starts[0]
        contains = [c for c in commodities if target in normalise(c.get("cmdt_name"))]
        return contains[0] if contains else None

    def resolve_state_id(self, filters: Dict[str, Any], state: str) -> Optional[int]:
        target = normalise(state or "Karnataka")
        if not filters and target in self.COMMON_STATES:
            return self.COMMON_STATES[target]
        if not filters:
            return None
        for item in filters.get("state_data") or []:
            if normalise(item.get("state_name")) == target:
                return item.get("state_id")
        for item in filters.get("state_data") or []:
            if target in normalise(item.get("state_name")):
                return item.get("state_id")
        return None

    def market_location_score(self, market_name: str, location: str) -> int:
        name = normalise(market_name)
        loc = normalise(location)
        tokens = [t for t in re.split(r"\s+", loc) if len(t) > 2]
        for src, alts in self.LOCATION_ALIASES.items():
            if src in loc:
                tokens.extend(alts)
        score = 0
        for token in tokens:
            if token in name:
                score += 10
        return score

    def location_tokens(self, *values: Optional[str]) -> List[str]:
        tokens: List[str] = []
        for value in values:
            norm = normalise(value or "")
            if not norm:
                continue
            parts = [norm, *[p for p in re.split(r"\s+", norm) if len(p) > 2]]
            for src, aliases in self.LOCATION_ALIASES.items():
                if src in norm:
                    parts.extend(aliases)
            for part in parts:
                part = part.strip()
                if part and part not in tokens:
                    tokens.append(part)
        return tokens

    def resolve_market_scope(
        self,
        filters: Optional[Dict[str, Any]],
        state_id: Optional[int],
        district: Optional[str],
        mandi: Optional[str],
        location: Optional[str],
    ) -> Dict[str, Any]:
        requested = mandi or district or location or ""
        tokens = self.location_tokens(mandi, district, location)
        district_ids = set()
        market_ids = set()
        if filters:
            for item in filters.get("district_data") or []:
                item_state = item.get("state_id") or item.get("stateId")
                if state_id and item_state and item_state != state_id:
                    continue
                name = normalise(item.get("district_name") or item.get("districtName") or item.get("name"))
                if any(token in name or name in token for token in tokens):
                    district_ids.add(item.get("district_id") or item.get("districtId") or item.get("id"))
            for item in filters.get("market_data") or []:
                item_state = item.get("state_id") or item.get("stateId")
                if state_id and item_state and item_state != state_id:
                    continue
                name = normalise(item.get("market_name") or item.get("marketName") or item.get("name"))
                item_district = item.get("district_id") or item.get("districtId")
                name_match = any(token in name for token in tokens)
                district_match = bool(item_district and item_district in district_ids)
                if name_match or district_match:
                    market_ids.add(item.get("market_id") or item.get("marketId") or item.get("id"))
        return {
            "requested": requested,
            "tokens": tokens,
            "district_ids": {item for item in district_ids if item is not None},
            "market_ids": {item for item in market_ids if item is not None},
            "strict": bool(tokens),
        }

    def market_matches_scope(self, market: Dict[str, Any], scope: Dict[str, Any]) -> bool:
        market_id = market.get("marketId") or market.get("market_id") or market.get("id")
        market_ids = scope.get("market_ids") or set()
        if market_ids:
            return market_id in market_ids
        tokens = scope.get("tokens") or []
        market_name = normalise(market.get("marketName") or market.get("market_name") or "")
        return any(token in market_name for token in tokens)

    def flatten_agmarknet_records(
        self,
        data: Dict[str, Any],
        state_id: Optional[int],
        location: str,
        market_scope: Optional[Dict[str, Any]] = None,
    ) -> List[dict]:
        records: List[dict] = []
        for state in data.get("states") or []:
            if state_id and state.get("stateId") != state_id:
                continue
            for market in state.get("markets") or []:
                if market_scope and market_scope.get("strict") and not self.market_matches_scope(market, market_scope):
                    continue
                location_score = self.market_location_score(market.get("marketName", ""), location)
                for row in market.get("data") or []:
                    modal = row.get("modalPrice")
                    if modal is None:
                        continue
                    records.append(
                        {
                            "state": state.get("stateName"),
                            "market_id": market.get("marketId"),
                            "name": market.get("marketName"),
                            "price": int(float(modal)),
                            "min_price": int(float(row.get("minimumPrice") or modal)),
                            "max_price": int(float(row.get("maximumPrice") or modal)),
                            "arrivals": row.get("arrivals"),
                            "arrival_unit": row.get("unitOfArrivals"),
                            "variety": row.get("variety"),
                            "grade": row.get("grade"),
                            "unit": row.get("unitOfPrice") or "Rs./Quintal",
                            "location_score": location_score,
                        }
                    )
        records.sort(key=lambda r: (r["location_score"], r.get("arrivals") or 0, r["price"]), reverse=True)
        return records

    async def fetch_agmarknet_report(self, commodity: Dict[str, Any], date_value: datetime, timeout: float = 14) -> Optional[Dict[str, Any]]:
        key = f"{commodity.get('cmdt_id')}:{date_value.strftime('%Y-%m-%d')}"
        cached = self.REPORT_CACHE.get(key)
        if cached and datetime.now() - cached["created_at"] < timedelta(minutes=20):
            return cached["data"]
        try:
            async with httpx.AsyncClient(timeout=timeout, headers=self.AGMARKNET_HEADERS) as client:
                resp = await client.get(
                    "https://api.agmarknet.gov.in/v1/prices-and-arrivals/market-report/specific",
                    params={
                        "date": date_value.strftime("%Y-%m-%d"),
                        "commodityGroupId": commodity.get("cmdt_group_id"),
                        "commodityId": commodity.get("cmdt_id"),
                        "includeExcel": "false",
                    },
                )
                resp.raise_for_status()
                payload = resp.json()
            if payload.get("success"):
                self.REPORT_CACHE[key] = {"created_at": datetime.now(), "data": payload}
                return payload
            self.REPORT_CACHE[key] = {"created_at": datetime.now(), "data": None}
            return None
        except Exception:
            self.REPORT_CACHE[key] = {"created_at": datetime.now(), "data": None}
            return None

    async def fetch_agmarknet(
        self,
        crop: str,
        state: str,
        location: str,
        district: Optional[str] = None,
        mandi: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        crop_key = normalise(crop)
        commodity = self.COMMON_COMMODITIES.get(crop_key)
        filters = self.FILTER_CACHE.get("data")
        if not commodity:
            filters = await self.fetch_agmarknet_filters()
        commodity = commodity or self.resolve_commodity(filters, crop)
        if not commodity:
            return None
        state_id = self.COMMON_STATES.get(normalise(state or "Karnataka")) or self.resolve_state_id(filters, state)
        market_scope = self.resolve_market_scope(filters, state_id, district, mandi, location)
        display_location = district or location
        today = datetime.now()
        current_payload = None
        current_date = today
        for days_back in range(0, 3):
            report_date = today - timedelta(days=days_back)
            current_payload = await self.fetch_agmarknet_report(commodity, report_date, timeout=5)
            records = self.flatten_agmarknet_records(current_payload or {}, state_id, display_location, market_scope) if current_payload else []
            if records:
                current_date = report_date
                break
        else:
            return self.unavailable_market(
                crop,
                location=display_location,
                state=state,
                district=district or location,
                source="Agmarknet 2.0 live report",
                message="No market data available for selected district.",
            )

        records = self.flatten_agmarknet_records(current_payload or {}, state_id, display_location, market_scope)
        if not records:
            return self.unavailable_market(
                crop,
                location=display_location,
                state=state,
                district=district or location,
                source="Agmarknet 2.0 live report",
                message="No market data available for selected district.",
            )

        selected = records[:5]
        current = round(sum(r["price"] for r in selected) / len(selected))
        previous = None
        previous_label = "Previous"
        for days_back in range(1, 3):
            report_date = current_date - timedelta(days=days_back)
            previous_payload = await self.fetch_agmarknet_report(commodity, report_date, timeout=4)
            previous_records = self.flatten_agmarknet_records(previous_payload or {}, state_id, display_location, market_scope) if previous_payload else []
            if previous_records:
                previous_selected = previous_records[:5]
                previous = round(sum(r["price"] for r in previous_selected) / len(previous_selected))
                previous_label = report_date.strftime("%d %b")
                break

        markets = [
            {
                "name": r["name"],
                "price": r["price"],
                "distance_km": "selected district",
                "arrivals": r["arrivals"],
                "arrival_unit": r["arrival_unit"],
                "variety": r["variety"],
                "grade": r["grade"],
                "min_price": r["min_price"],
                "max_price": r["max_price"],
            }
            for r in selected
        ]
        source = f"Agmarknet 2.0 live report ({current_date.strftime('%d %b %Y')})"
        return self.market_payload(
            crop,
            current,
            source,
            markets,
            previous_price=previous,
            previous_label=previous_label,
            location=display_location,
            state=state,
            district=district or location,
        )

    async def fetch_data_gov(
        self,
        crop: str,
        state: str,
        district: Optional[str] = None,
        mandi: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        if not DATA_GOV_API_KEY:
            return None
        params = [
            ("api-key", DATA_GOV_API_KEY),
            ("format", "json"),
            ("limit", 25),
            ("filters[commodity]", crop.title()),
            ("filters[state]", state),
        ]
        if district:
            params.append(("filters[district]", district.title()))
        if mandi:
            params.append(("filters[market]", mandi.title()))
        urls = [
            "https://api.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi",
            "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
        ]
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                records = []
                for url in urls:
                    try:
                        resp = await asyncio.wait_for(client.get(url, params=params), timeout=4.5)
                        resp.raise_for_status()
                        records = resp.json().get("records") or []
                        if records:
                            break
                    except Exception:
                        continue
            prices = [float(r.get("modal_price") or 0) for r in records if r.get("modal_price")]
            if not prices:
                return None
            current = int(sum(prices) / len(prices))
            markets = [
                {
                    "name": f"{r.get('market', 'Mandi')} {r.get('district', '')}".strip(),
                    "price": int(float(r.get("modal_price") or current)),
                    "distance_km": "selected district",
                    "min_price": int(float(r.get("min_price") or r.get("modal_price") or current)),
                    "max_price": int(float(r.get("max_price") or r.get("modal_price") or current)),
                }
                for r in records[:3]
            ]
            return self.market_payload(crop, current, "data.gov.in Agmarknet API", markets, location=district or mandi or "", state=state, district=district or "")
        except Exception:
            return None

    def unavailable_market(
        self,
        crop: str,
        location: str = "",
        state: str = "",
        district: str = "",
        source: str = "Agmarknet/Data.gov.in live feed",
        message: str = "Live mandi data could not be fetched right now. Retry in a few minutes or check Agmarknet/Data.gov.in connectivity.",
    ) -> Dict[str, Any]:
        return {
            "available": False,
            "crop": crop.title(),
            "location": location,
            "state": state,
            "district": district,
            "current_price": None,
            "week_ago": None,
            "month_ago": None,
            "unit": "per quintal (100 kg)",
            "price_change": 0,
            "trend": "unavailable",
            "msp": None,
            "best_market": "No market data available for selected district",
            "demand": "Unknown",
            "source": source,
            "updated_at": now_iso(),
            "ai_prediction": message,
            "chart": [],
            "top_markets": [],
        }

    def market_payload(
        self,
        crop: str,
        current: int,
        source: str,
        markets: List[dict],
        previous_price: Optional[int] = None,
        previous_label: str = "Previous",
        location: str = "",
        state: str = "",
        district: str = "",
    ) -> Dict[str, Any]:
        week_ago = previous_price or current
        month_ago = previous_price or current
        change = round(((current - week_ago) / week_ago) * 100, 2) if week_ago else 0
        predicted = int(current * (1.03 if change >= 0 else 0.97))
        return {
            "available": True,
            "crop": crop.title(),
            "location": location,
            "state": state,
            "district": district,
            "current_price": current,
            "week_ago": week_ago,
            "month_ago": month_ago,
            "unit": "per quintal (100 kg)",
            "price_change": change,
            "trend": "rising" if change > 0 else "falling" if change < 0 else "stable",
            "msp": int(current * 0.85),
            "best_market": max(markets, key=lambda m: m["price"])["name"],
            "demand": "High" if sum(float(m.get("arrivals") or 0) for m in markets) > 100 else "Moderate",
            "source": source,
            "updated_at": now_iso(),
            "ai_prediction": f"Agmarknet live prices show {crop.title()} around Rs {current}/quintal near {location or 'the selected region'}. Compare arrivals before deciding the selling market.",
            "chart": [
                {"label": previous_label, "price": week_ago},
                {"label": "Today", "price": current},
                {"label": "Signal", "price": predicted},
            ],
            "top_markets": markets,
        }


class OrchestratorAgent:
    name = "Orchestrator Agent"
    KNOWN_LOCATIONS = [
        "mysore", "mysuru", "bangalore", "bengaluru", "mandya", "kolar", "hassan",
        "tumkur", "hubli", "dharwad", "belagavi", "mangalore", "shivamogga",
        "raichur", "ballari", "koppal", "udupi", "kalaburagi",
    ]
    KNOWN_CROPS = [
        "tomato", "rice", "paddy", "wheat", "maize", "onion", "potato", "cotton",
        "sugarcane", "soybean", "groundnut", "ragi", "millet", "chilli", "banana",
    ]

    def __init__(self) -> None:
        self.crop_agent = CropDiagnosticAgent()
        self.weather_agent = WeatherRiskAgent()
        self.scheme_agent = GovernmentSchemeAgent()
        self.market_agent = MarketPriceAgent()

    def plan(self, query: str, has_image: bool = False) -> List[str]:
        q = normalise(query)
        agents = []
        crop_issue = any(w in q for w in ["disease", "leaf", "yellow", "pest", "deficiency", "spots", "turning", "wilting", "fungal", "blight"])
        has_location_hint = any(w in q for w in [*self.KNOWN_LOCATIONS, "today", "tomorrow"])
        if has_image or crop_issue:
            agents.append("diagnosis")
        if crop_issue or has_location_hint or any(w in q for w in ["weather", "rain", "humidity", "spray", "irrigation", "risk"]):
            agents.append("weather")
        if any(w in q for w in ["scheme", "subsidy", "pm kisan", "pm-kisan", "loan", "insurance", "kcc"]):
            agents.append("schemes")
        if any(w in q for w in ["price", "market", "mandi", "sell", "rate"]):
            agents.append("market")
        if not agents:
            agents = ["diagnosis", "weather", "schemes", "market"]
        return agents

    def enrich_profile_from_query(self, query: str, profile: Dict[str, Any]) -> Dict[str, Any]:
        enriched = dict(profile or {})
        q = normalise(query)
        detected_crop = None
        for crop in self.KNOWN_CROPS:
            if crop in q:
                detected_crop = "Rice" if crop == "paddy" else crop.title()
                break
        if detected_crop:
            enriched["crop"] = detected_crop
            enriched["crop_source"] = "query"
        elif enriched.get("crop"):
            enriched["crop_source"] = "profile"

        detected_location = None
        for loc in self.KNOWN_LOCATIONS:
            if loc in q:
                detected_location = "Mysuru" if loc == "mysore" else "Bengaluru" if loc == "bangalore" else loc.title()
                break
        if detected_location:
            enriched["location"] = detected_location
            enriched["location_source"] = "query"
            enriched.setdefault("state", "Karnataka")
        elif enriched.get("location"):
            enriched["location_source"] = "profile"
        if enriched.get("state"):
            enriched["state_source"] = "profile_or_query"
        return enriched

    def clarification_message(self, plan: List[str], profile: Dict[str, Any]) -> Optional[str]:
        location_needed = any(agent in plan for agent in ["weather", "market", "diagnosis"])
        state_needed = "schemes" in plan
        crop_needed = any(agent in plan for agent in ["market", "diagnosis"])
        if location_needed and not profile.get("location"):
            return "Please share your village/city or district first, so I can check local weather, mandi, and crop risk data accurately."
        if state_needed and not (profile.get("state") or profile.get("location")):
            return "Please share your state or district first, so I can search relevant central and state agriculture schemes."
        if crop_needed and not profile.get("crop"):
            return "Which crop should I analyze? Please tell me the crop name and your location."
        return None

    async def run(
        self,
        query: str,
        language: str = "en",
        profile: Optional[Dict[str, Any]] = None,
        image_bytes: Optional[bytes] = None,
        file_name: str = "",
    ) -> Dict[str, Any]:
        farmer_profile = self.enrich_profile_from_query(query, profile or {})
        ctx = SharedContext(query=query, language=language, farmer_profile=farmer_profile)
        ctx.start(self.name, "Analyzing query and selecting specialist agents")
        plan = self.plan(query, has_image=bool(image_bytes))
        ctx.finish(self.name, " -> ".join(plan))
        clarification = self.clarification_message(plan, farmer_profile)
        if clarification:
            ctx.findings["missing_context"] = {
                "message": clarification,
                "required_for": plan,
                "profile": farmer_profile,
                "updated_at": now_iso(),
            }
            return {
                "status": "needs_context",
                "response": clarification,
                "agent_flow": ctx.agent_flow,
                "shared_context": ctx.findings,
                "updated_at": now_iso(),
            }

        tasks = []
        if "diagnosis" in plan:
            tasks.append(self.crop_agent.run(ctx, image_bytes=image_bytes, file_name=file_name))
        if "weather" in plan:
            tasks.append(self.weather_agent.run(ctx, location=ctx.farmer_profile.get("location")))
        if "schemes" in plan:
            tasks.append(self.scheme_agent.run(ctx))
        if "market" in plan:
            tasks.append(
                self.market_agent.run(
                    ctx,
                    crop=ctx.farmer_profile.get("crop"),
                    state=ctx.farmer_profile.get("state", "Karnataka"),
                    location=ctx.farmer_profile.get("location"),
                )
            )
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        if ENABLE_TAVILY_SEARCH:
            ctx.start("Live Web Intelligence Agent", "Searching current agriculture advisories")
            search_query = (
                f"{farmer_profile.get('crop', '')} crop advisory disease market weather schemes "
                f"{farmer_profile.get('location', '')} {farmer_profile.get('state', '')} India"
            )
            web_results = await tavily_search(search_query)
            ctx.findings["web_intelligence"] = web_results
            ctx.finish(
                "Live Web Intelligence Agent",
                f"Found {len(web_results)} current advisory sources" if web_results else "No live web results available",
                "success" if web_results else "warning",
            )

        response = await self.summarize(ctx)
        return {
            "status": "success",
            "response": response,
            "agent_flow": ctx.agent_flow,
            "shared_context": ctx.findings,
            "updated_at": now_iso(),
        }

    async def summarize(self, ctx: SharedContext) -> str:
        if ENABLE_LIVE_AI:
            compact = json.dumps(ctx.findings, ensure_ascii=True)[:5500]
            system = (
                MASTER_SYSTEM_PROMPT
                + "\n\nUse only the provided SharedContext, web search snippets, weather, market, map, soil, and scheme data. "
                "For market answers include market name, min price, max price, modal price, state/location, timestamp, and source when present. "
                "For scheme answers include why it matches the crop/location/profile and cite live scheme source titles when present. "
                "Do not repeat a generic template."
            )
            prompt = (
                f"Farmer query: {ctx.query}\n"
                f"Farmer profile: {json.dumps(ctx.farmer_profile, ensure_ascii=True)}\n"
                f"Current timestamp: {now_iso()}\n"
                f"Shared live context: {compact}\n\n"
                "Return a short farmer-friendly answer. Use bullet points only when useful. "
                "Include source/timestamp confidence in one line if live data was used."
            )
            try:
                ctx.start("Live AI Synthesis Agent", "Generating contextual response from live context")
                answer = await live_ai_generate(prompt, system=system, timeout=8)
                ctx.findings["ai_provider"] = "live"
                ctx.finish("Live AI Synthesis Agent", "Contextual live response generated")
                return answer
            except Exception as exc:
                ctx.findings["ai_provider_error"] = str(exc)
                ctx.finish("Live AI Synthesis Agent", "Live model unavailable; using deterministic fallback", "warning")
        if not ENABLE_OLLAMA_SUMMARY:
            return self.offline_summary(ctx)
        compact = json.dumps(ctx.findings, ensure_ascii=True)[:3500]
        system = (
            MASTER_SYSTEM_PROMPT
            + "\nUse the shared context to answer in simple language. Mention uncertainty and next actions."
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
            parts.append(f"Weather risk for {weather.get('location', ctx.farmer_profile.get('location', 'selected location'))}: fungal {risk.get('fungal_spread')}%, heat {risk.get('heat_stress')}%. {weather.get('advisory')} Source: {weather.get('source')} at {weather.get('updated_at')}.")
        if schemes:
            source_titles = [s.get("title") for s in schemes.get("summary", {}).get("live_sources", [])[:2] if s.get("title")]
            source_note = f" Live references: {', '.join(source_titles)}." if source_titles else ""
            parts.append(f"Schemes for {schemes['summary'].get('crop')} in {schemes['summary'].get('state')}: {schemes['summary']['eligible_count']} likely matches. Top match: {schemes['schemes'][0]['name']}.{source_note}")
        if market:
            if market.get("available"):
                top = (market.get("top_markets") or [{}])[0]
                parts.append(
                    f"Market: {market['crop']} near {market.get('location')} is Rs {market['current_price']}/quintal average, trend {market['trend']}. "
                    f"Best market {top.get('name')} modal Rs {top.get('price')}, min Rs {top.get('min_price')}, max Rs {top.get('max_price')}. "
                    f"Source: {market.get('source')} at {market.get('updated_at')}."
                )
            else:
                parts.append(f"Market: live price feed unavailable for {market.get('crop')}. Source: {market.get('source')}.")
        return "\n".join(parts) or "I checked the local agents, but need more crop, location, or image details to give specific advice."
