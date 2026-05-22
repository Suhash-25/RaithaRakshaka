import asyncio
import math
import os
import time
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents import (
    SharedContext,
    CropDiagnosticAgent,
    WeatherRiskAgent,
    GovernmentSchemeAgent,
    MarketPriceAgent,
    OrchestratorAgent,
    now_iso,
)

app = FastAPI(title="RaithaRakshaka API", version="2.0.0")

orchestrator_agent = OrchestratorAgent()
crop_agent = CropDiagnosticAgent()
weather_agent = WeatherRiskAgent()
scheme_agent = GovernmentSchemeAgent()
market_agent = MarketPriceAgent()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    history: Optional[List[dict]] = []
    profile: Optional[Dict] = None

class SchemeRequest(BaseModel):
    state: str = "Karnataka"
    crop: str = "Tomato"
    land_acres: float = 2.0
    category: str = "small"
    distress_level: str = ""

class WellnessRequest(BaseModel):
    concern: str
    language: str = "en"

class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    crop: Optional[str] = None
    season: Optional[str] = None

class CropRecommendationRequest(LocationRequest):
    land_acres: float = 2.0

GEO_CACHE: Dict[str, dict] = {}
CACHE_TTL_SECONDS = 15 * 60

# Helper for Groq since we want to move off Ollama
import httpx
async def groq_generate(prompt: str, system: str = "") -> str:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY not found")
        
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

def cache_key(prefix: str, lat: float, lon: float) -> str:
    return f"{prefix}:{round(lat, 3)}:{round(lon, 3)}"

def get_cached(key: str):
    item = GEO_CACHE.get(key)
    if not item:
        return None
    if time.time() - item["created_at"] > CACHE_TTL_SECONDS:
        GEO_CACHE.pop(key, None)
        return None
    return item["value"]

def set_cached(key: str, value: dict) -> dict:
    GEO_CACHE[key] = {"created_at": time.time(), "value": value}
    return value

def clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))

def infer_soil_type(lat: float, lon: float, elevation: float) -> str:
    band = abs(math.sin(math.radians(lat * 3.7)) + math.cos(math.radians(lon * 2.1)))
    if elevation > 900:
        return "Red loamy upland soil"
    if band > 1.35:
        return "Black cotton soil"
    if band > 0.85:
        return "Alluvial loam"
    if band > 0.45:
        return "Sandy loam"
    return "Lateritic soil"

def agronomy_from_weather(weather: dict, elevation: float, lat: float, lon: float) -> dict:
    temp = weather.get("temperature", 28)
    humidity = weather.get("humidity", 60)
    rainfall = weather.get("rainfall", 0)
    wind = weather.get("wind_speed", 8)
    soil_moisture = clamp(35 + rainfall * 4 + (humidity - 50) * 0.45 - max(temp - 32, 0) * 2)
    ndvi = clamp(0.28 + (soil_moisture / 100) * 0.42 + (humidity / 100) * 0.16 - max(temp - 35, 0) * 0.015, 0.12, 0.88)
    drought = clamp(75 - soil_moisture + max(temp - 34, 0) * 4 - rainfall * 2)
    flood = clamp(rainfall * 6 + max(humidity - 85, 0) * 1.5 - max(elevation - 800, 0) * 0.02)
    pest = clamp(humidity * 0.55 + temp * 1.1 - wind * 0.7 - 30)
    disease = clamp(humidity * 0.75 + rainfall * 3 - max(temp - 34, 0) * 2 - 35)
    sunlight = clamp(70 - humidity * 0.25 + max(temp - 26, 0) * 1.5)
    health = clamp(ndvi * 78 + soil_moisture * 0.22 - drought * 0.16 - disease * 0.1)
    soil_type = infer_soil_type(lat, lon, elevation)
    crops = crop_suitability(soil_type, temp, humidity, soil_moisture, rainfall)
    return {
        "soil_type": soil_type,
        "soil_moisture": round(soil_moisture),
        "soil_ph": round(6.1 + (math.sin(math.radians(lat + lon)) * 0.8), 1),
        "fertility": "High" if soil_moisture > 58 and ndvi > 0.55 else "Moderate" if soil_moisture > 35 else "Low",
        "nitrogen": round(clamp(42 + ndvi * 38 - max(temp - 34, 0) * 2)),
        "phosphorus": round(clamp(34 + soil_moisture * 0.35 + (10 if "loam" in soil_type.lower() else 0))),
        "potassium": round(clamp(48 + (12 if "black" in soil_type.lower() else 0) + soil_moisture * 0.22)),
        "ndvi": round(ndvi, 2),
        "green_coverage": round(ndvi * 100),
        "land_health_score": round(health),
        "crop_stress": "High" if health < 45 else "Moderate" if health < 68 else "Low",
        "drought_risk": round(drought),
        "flood_risk": round(flood),
        "pest_risk": round(pest),
        "disease_risk": round(disease),
        "sunlight_score": round(sunlight),
        "suitable_crops": crops,
    }

def crop_suitability(soil_type: str, temp: float, humidity: float, moisture: float, rainfall: float) -> List[str]:
    soil = soil_type.lower()
    crops = []
    if moisture > 65 or rainfall > 8:
        crops.extend(["Paddy", "Sugarcane"])
    if 20 <= temp <= 34 and moisture >= 38:
        crops.extend(["Tomato", "Maize", "Groundnut"])
    if "black" in soil:
        crops.extend(["Cotton", "Soybean", "Sorghum"])
    if "sandy" in soil:
        crops.extend(["Groundnut", "Millets", "Watermelon"])
    if "red" in soil or "lateritic" in soil:
        crops.extend(["Ragi", "Pulses", "Cashew"])
    if humidity < 55 and temp < 32:
        crops.append("Wheat")
    seen = []
    for crop in crops or ["Millets", "Pulses", "Vegetables"]:
        if crop not in seen:
            seen.append(crop)
    return seen[:6]

async def reverse_geocode(lat: float, lon: float) -> dict:
    key = cache_key("geo", lat, lon)
    cached = get_cached(key)
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=4, headers={"User-Agent": "RaithaRakshakaAI/2.0"}) as client:
            resp = await asyncio.wait_for(
                client.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 12, "addressdetails": 1},
                ),
                timeout=0.9,
            )
            resp.raise_for_status()
            data = resp.json()
        address = data.get("address", {})
        value = {
            "region": address.get("village") or address.get("town") or address.get("city") or address.get("county") or data.get("name") or "Selected land parcel",
            "district": address.get("state_district") or address.get("county") or "",
            "state": address.get("state") or "",
            "country": address.get("country") or "Unknown",
            "display_name": data.get("display_name") or "",
        }
    except Exception:
        value = {"region": "Selected land parcel", "district": "", "state": "", "country": "Unknown", "display_name": ""}
    return set_cached(key, value)

async def fetch_point_weather(lat: float, lon: float) -> dict:
    key = cache_key("weather", lat, lon)
    cached = get_cached(key)
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await asyncio.wait_for(
                client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m",
                        "daily": "uv_index_max,precipitation_probability_max,temperature_2m_max,temperature_2m_min",
                        "forecast_days": 3,
                        "timezone": "auto",
                    },
                ),
                timeout=1.2,
            )
            resp.raise_for_status()
            data = resp.json()
        current = data.get("current", {})
        daily = data.get("daily", {})
        value = {
            "temperature": round(float(current.get("temperature_2m") or 28), 1),
            "humidity": round(float(current.get("relative_humidity_2m") or 60)),
            "rainfall": round(float(current.get("rain") or current.get("precipitation") or 0), 1),
            "wind_speed": round(float(current.get("wind_speed_10m") or 0), 1),
            "wind_direction": round(float(current.get("wind_direction_10m") or 0)),
            "condition": weather_code_label(current.get("weather_code")),
            "uv_index": round(float((daily.get("uv_index_max") or [6])[0] or 6), 1),
            "pressure": round(float(current.get("surface_pressure") or 1012), 1),
            "rain_probability": round(float((daily.get("precipitation_probability_max") or [0])[0] or 0)),
            "source": "Open-Meteo live forecast",
        }
    except Exception:
        value = {
            "temperature": 29,
            "humidity": 62,
            "rainfall": 0,
            "wind_speed": 8,
            "wind_direction": 180,
            "condition": "Offline estimate",
            "uv_index": 7,
            "pressure": 1012,
            "rain_probability": 25,
            "source": "offline fallback",
        }
    return set_cached(key, value)

def weather_code_label(code) -> str:
    labels = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        51: "Light drizzle",
        61: "Rain",
        63: "Moderate rain",
        65: "Heavy rain",
        80: "Rain showers",
        95: "Thunderstorm",
    }
    try:
        return labels.get(int(code), "Variable conditions")
    except Exception:
        return "Variable conditions"

async def fetch_elevation(lat: float, lon: float) -> float:
    key = cache_key("elevation", lat, lon)
    cached = get_cached(key)
    if cached is not None:
        return cached.get("elevation", 0)
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            resp = await asyncio.wait_for(
                client.get(
                    "https://api.open-meteo.com/v1/elevation",
                    params={"latitude": lat, "longitude": lon},
                ),
                timeout=0.9,
            )
            resp.raise_for_status()
            elevation = float((resp.json().get("elevation") or [0])[0] or 0)
    except Exception:
        elevation = round(250 + abs(math.sin(math.radians(lat * lon))) * 650)
    set_cached(key, {"elevation": elevation})
    return elevation

def ai_land_recommendations(region: dict, weather: dict, agro: dict) -> List[str]:
    recs = []
    crops = ", ".join(agro["suitable_crops"][:3])
    recs.append(f"This land near {region['region']} is currently suitable for {crops} based on moisture, temperature, and inferred soil profile.")
    if agro["disease_risk"] > 65:
        recs.append("High humidity and rainfall may increase fungal disease pressure. Scout lower leaves and avoid evening overhead irrigation.")
    if agro["drought_risk"] > 60:
        recs.append("Drought stress is elevated. Prioritize mulching, drip irrigation, and drought-tolerant crop choices.")
    if agro["soil_moisture"] < 40:
        recs.append("Soil moisture is low. Recommended irrigation frequency: every 2 days until rainfall improves.")
    elif agro["soil_moisture"] > 70:
        recs.append("Moisture is high. Improve drainage and delay irrigation to prevent root stress.")
    else:
        recs.append("Moisture is moderate. Irrigate every 3-4 days and adjust after rainfall.")
    if weather["wind_speed"] > 20:
        recs.append("Wind speed is high. Avoid spraying pesticides until calmer hours.")
    return recs[:5]


@app.post("/api/chat")
async def chat(req: ChatRequest):
    return await orchestrator_agent.run(
        query=req.message,
        language=req.language,
        profile=req.profile or {},
    )

@app.post("/api/orchestrate")
async def orchestrate(req: ChatRequest):
    return await chat(req)

@app.post("/api/weather-data")
async def weather_data(req: LocationRequest):
    weather, region = await asyncio.gather(
        fetch_point_weather(req.latitude, req.longitude),
        reverse_geocode(req.latitude, req.longitude),
    )
    return {"latitude": req.latitude, "longitude": req.longitude, "region": region, "weather": weather, "updated_at": now_iso()}

@app.post("/api/soil-data")
async def soil_data(req: LocationRequest):
    weather, elevation = await asyncio.gather(
        fetch_point_weather(req.latitude, req.longitude),
        fetch_elevation(req.latitude, req.longitude),
    )
    agro = agronomy_from_weather(weather, elevation, req.latitude, req.longitude)
    return {
        "latitude": req.latitude,
        "longitude": req.longitude,
        "elevation": round(elevation),
        "soil": {
            "type": agro["soil_type"],
            "moisture": agro["soil_moisture"],
            "ph": agro["soil_ph"],
            "fertility": agro["fertility"],
            "nitrogen": agro["nitrogen"],
            "phosphorus": agro["phosphorus"],
            "potassium": agro["potassium"],
            "source": "Open-Meteo weather + terrain-informed agronomy model",
        },
        "updated_at": now_iso(),
    }

@app.post("/api/ndvi-analysis")
async def ndvi_analysis(req: LocationRequest):
    weather, elevation = await asyncio.gather(
        fetch_point_weather(req.latitude, req.longitude),
        fetch_elevation(req.latitude, req.longitude),
    )
    agro = agronomy_from_weather(weather, elevation, req.latitude, req.longitude)
    return {
        "latitude": req.latitude,
        "longitude": req.longitude,
        "satellite": {
            "ndvi": agro["ndvi"],
            "green_coverage": agro["green_coverage"],
            "land_health_score": agro["land_health_score"],
            "crop_stress": agro["crop_stress"],
            "source": "near-real-time vegetation proxy; plug Sentinel Hub key for true imagery NDVI",
        },
        "updated_at": now_iso(),
    }

@app.post("/api/crop-recommendation")
async def crop_recommendation(req: CropRecommendationRequest):
    weather, region, elevation = await asyncio.gather(
        fetch_point_weather(req.latitude, req.longitude),
        reverse_geocode(req.latitude, req.longitude),
        fetch_elevation(req.latitude, req.longitude),
    )
    agro = agronomy_from_weather(weather, elevation, req.latitude, req.longitude)
    return {
        "suitable_crops": agro["suitable_crops"],
        "seasonal_recommendations": [
            "Choose short-duration varieties if rain probability is unstable.",
            "Use seed treatment and raised beds when disease risk is above 60%.",
            "Combine organic matter with soil-test based NPK application.",
        ],
        "irrigation": "Every 2 days" if agro["soil_moisture"] < 40 else "Every 3-4 days" if agro["soil_moisture"] < 65 else "Delay irrigation; monitor drainage",
        "risk": {
            "drought": agro["drought_risk"],
            "flood": agro["flood_risk"],
            "pest": agro["pest_risk"],
            "disease": agro["disease_risk"],
        },
        "ai_recommendations": ai_land_recommendations(region, weather, agro),
        "updated_at": now_iso(),
    }

@app.post("/api/analyze-location")
async def analyze_location(req: LocationRequest):
    lat, lon = req.latitude, req.longitude
    region, weather, elevation = await asyncio.gather(
        reverse_geocode(lat, lon),
        fetch_point_weather(lat, lon),
        fetch_elevation(lat, lon),
    )
    agro = agronomy_from_weather(weather, elevation, lat, lon)
    recommendations = ai_land_recommendations(region, weather, agro)
    return {
        "status": "success",
        "updated_at": now_iso(),
        "basic": {
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "region": region["region"],
            "district": region["district"],
            "state": region["state"],
            "country": region["country"],
            "elevation": round(elevation),
        },
        "weather": weather,
        "soil": {
            "type": agro["soil_type"],
            "moisture": agro["soil_moisture"],
            "ph": agro["soil_ph"],
            "fertility": agro["fertility"],
            "nitrogen": agro["nitrogen"],
            "phosphorus": agro["phosphorus"],
            "potassium": agro["potassium"],
        },
        "agriculture": {
            "suitable_crops": agro["suitable_crops"],
            "seasonal_recommendations": [
                "Scout field edges weekly and maintain crop spacing for airflow.",
                "Use mulch or drip irrigation if drought risk rises above 55%.",
                "Apply fertilizer after rainfall risk drops below 40%.",
            ],
            "irrigation": "Every 2 days" if agro["soil_moisture"] < 40 else "Every 3-4 days" if agro["soil_moisture"] < 65 else "Delay irrigation; drainage watch",
            "drought_risk": agro["drought_risk"],
            "flood_risk": agro["flood_risk"],
            "pest_risk": agro["pest_risk"],
            "disease_risk": agro["disease_risk"],
            "sunlight_score": agro["sunlight_score"],
        },
        "satellite": {
            "ndvi": agro["ndvi"],
            "green_coverage": agro["green_coverage"],
            "land_health_score": agro["land_health_score"],
            "crop_stress": agro["crop_stress"],
        },
        "ai": {
            "summary": " ".join(recommendations[:2]),
            "recommendations": recommendations,
        },
        "sources": [
            weather["source"],
            "OpenStreetMap Nominatim reverse geocoding",
            "Open-Meteo elevation",
            "terrain and weather calibrated agronomy fallback model",
        ],
    }

@app.post("/api/disease/detect")
async def detect_disease(file: UploadFile = File(...), crop: str = "Tomato", location: str = "Bangalore"):
    image_bytes = await file.read()
    ctx = SharedContext(query=f"Diagnose crop disease for {crop}", farmer_profile={"crop": crop, "location": location})
    result = await crop_agent.run(ctx, image_bytes=image_bytes, file_name=file.filename or "upload.jpg")
    result["agent_flow"] = ctx.agent_flow
    return result

@app.get("/api/weather")
async def get_weather(location: str = "Bangalore"):
    ctx = SharedContext(query=f"Weather risk for {location}", farmer_profile={"location": location})
    result = await weather_agent.run(ctx, location=location)
    result["agent_flow"] = ctx.agent_flow
    return result

@app.post("/api/schemes/eligible")
async def get_schemes(req: SchemeRequest):
    profile = req.model_dump()
    ctx = SharedContext(query=f"Find schemes for {req.crop} farmer in {req.state}", farmer_profile=profile)
    result = await scheme_agent.run(ctx, profile)
    result["agent_flow"] = ctx.agent_flow
    return result

@app.get("/api/market/{crop}")
async def market_data(crop: str, state: str = "Karnataka"):
    ctx = SharedContext(query=f"Market price for {crop}", farmer_profile={"crop": crop, "state": state})
    result = await market_agent.run(ctx, crop=crop, state=state)
    result["agent_flow"] = ctx.agent_flow
    return result

@app.get("/api/market")
async def all_markets(state: str = "Karnataka"):
    crops = ["tomato", "onion", "potato", "rice", "wheat", "maize"]
    trending = []
    for crop in crops:
        ctx = SharedContext(query=f"Market price for {crop}", farmer_profile={"crop": crop, "state": state})
        data = await market_agent.run(ctx, crop=crop, state=state)
        trending.append({"crop": data["crop"], "price": data["current_price"], "change": data["price_change"], "source": data["source"]})
    return {"trending": trending, "updated_at": now_iso()}

@app.post("/api/wellness/support")
async def wellness(req: WellnessRequest):
    system = (
        "You are a compassionate farmer wellness counselor. Use warm, non-clinical language. "
        "Include practical next steps and farmer helplines: Kisan Call Centre 1800-180-1551 and PM-KISAN 155261."
    )
    prompt = f"Farmer concern: {req.concern}\nLanguage: {req.language}\nRespond under 180 words."
    try:
        reply = await groq_generate(prompt, system=system)
    except Exception:
        reply = (
            "You are not alone in this. Please speak with a trusted family member or local agriculture officer today. "
            "For immediate farming support, call Kisan Call Centre 1800-180-1551 or PM-KISAN helpline 155261."
        )
    return {
        "response": reply,
        "helplines": [
            {"name": "Kisan Call Centre", "number": "1800-180-1551", "timing": "6 AM - 10 PM"},
            {"name": "PM-KISAN Helpline", "number": "155261", "timing": "Working hours"},
            {"name": "iCall Mental Health", "number": "9152987821", "timing": "Mon-Sat 8 AM - 10 PM"},
        ],
        "resources": ["pmkisan.gov.in", "pmfby.gov.in", "Nearest agriculture office or CSC"],
    }

@app.get("/api/dashboard")
async def dashboard(location: str = "Bangalore", crop: str = "Tomato", state: str = "Karnataka", land_acres: float = 2):
    profile = {"location": location, "crop": crop, "state": state, "land_acres": land_acres, "category": "small"}
    scheme_ctx = SharedContext(query=f"Find schemes for {crop}", farmer_profile=profile)
    schemes = await scheme_agent.run(scheme_ctx, profile)
    market = market_agent.cached_market(crop)
    market_ctx = SharedContext(query=f"Market price for {crop}", farmer_profile=profile)
    market_ctx.agent_flow.append({"agent": "Market Price Agent", "status": "success", "message": "Used instant cached mandi baseline"})
    weather = weather_agent.offline_weather(location, "fast dashboard mode")
    
    fungal = weather.get("risk_scores", {}).get("fungal_spread", 0)
    health_score = max(35, 100 - int(fungal * 0.35))
    
    ai_tip = (
        f"{crop} market trend is {market.get('trend', 'stable')} and "
        f"{schemes.get('summary', {}).get('eligible_count', 0)} schemes look relevant. "
        "Open Smart Map for exact land-level weather, soil, and irrigation intelligence."
    )
        
    return {
        "crop_health_score": health_score,
        "weather_risk": "High" if fungal >= 70 else "Medium" if fungal >= 45 else "Low",
        "active_alerts": len(weather.get("alerts", [])),
        "schemes_eligible": schemes.get("summary", {}).get("eligible_count", 0),
        "market_trend": market.get("trend", "stable").title(),
        "ai_tip": ai_tip,
        "agent_flow": [
            {"agent": "Fast Dashboard Orchestrator", "status": "success", "message": "Returned instant cached agronomy summary"},
            *scheme_ctx.agent_flow,
            *market_ctx.agent_flow,
        ],
        "live_context": {"weather": weather, "schemes": schemes, "market": market},
        "stats": {
            "weather_source": weather.get("source", "unknown"),
            "market_source": market.get("source", "unknown"),
            "scheme_source": schemes.get("summary", {}).get("source", "local knowledge"),
            "updated_at": now_iso(),
        },
    }

@app.get("/api/health")
async def custom_health():
    return {
        "status": "healthy",
        "service": "RaithaRakshaka Multi-Agent AI",
        "version": "2.0.0",
        "agents": [
            "Weather Tool",
            "Market Tool",
            "Schemes Tool",
            "Crop Diagnostic Tool"
        ],
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8001)))
