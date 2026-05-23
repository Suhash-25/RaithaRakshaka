import asyncio
import json
import math
import os
import re
import time
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, Query
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

from translate import router as translate_router, detect_language, translate_many

try:
    from ml.disease_model import model_status as crop_disease_model_status
except Exception:
    crop_disease_model_status = None

app = FastAPI(title="RaithaRakshaka API", version="2.0.0")

app.include_router(translate_router)

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
VENDOR_CACHE: Dict[str, dict] = {}
CACHE_TTL_SECONDS = 15 * 60
ENABLE_SOILGRIDS = os.getenv("ENABLE_SOILGRIDS", "true").lower() == "true"

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

def response_matches_language(text: str, language: str) -> bool:
    if language == "hi":
        return bool(re.search(r"[\u0900-\u097F]", text or ""))
    if language == "kn":
        return bool(re.search(r"[\u0C80-\u0CFF]", text or ""))
    return True

def provider_status() -> dict:
    return {
        "live_ai": {
            "groq_configured": bool(os.getenv("GROQ_API_KEY")),
            "openrouter_configured": bool(os.getenv("OPENROUTER_API_KEY")),
        },
        "search": {"tavily_configured": bool(os.getenv("TAVILY_API_KEY"))},
        "weather": {"open_meteo": True},
        "soil": {"soilgrids_enabled": ENABLE_SOILGRIDS},
        "satellite": {"nasa_earthdata_configured": bool(os.getenv("NASA_EARTHDATA_TOKEN"))},
        "market": {"data_gov_configured": bool(os.getenv("DATA_GOV_API_KEY"))},
        "crop_disease_model": crop_disease_model_status()
        if crop_disease_model_status
        else {"available": False, "error": "Crop disease model module unavailable"},
        "memory": {
            "supabase_configured": bool(
                os.getenv("SUPABASE_URL")
                and (
                    os.getenv("SUPABASE_PUBLISHABLE_KEY")
                    or os.getenv("SUPABASE_ANON_KEY")
                    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                )
            ),
        },
    }

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
        async with httpx.AsyncClient(timeout=7, headers={"User-Agent": "RaithaRakshakaAI/2.0"}) as client:
            resp = await asyncio.wait_for(
                client.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 12, "addressdetails": 1},
                ),
                timeout=3.5,
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
            "category": data.get("category") or "",
            "osm_type": data.get("type") or "",
            "address": address,
        }
    except Exception:
        value = {"region": "Selected land parcel", "district": "", "state": "", "country": "Unknown", "display_name": "", "category": "", "osm_type": "", "address": {}}
    return set_cached(key, value)

async def geocode_location_text(location: str) -> dict:
    key = f"geocode:{normalise_location_key(location)}"
    cached = get_cached(key)
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=8, headers={"User-Agent": "RaithaRakshakaAI/2.0"}) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"format": "jsonv2", "limit": 1, "addressdetails": 1, "q": location},
            )
            response.raise_for_status()
            item = (response.json() or [])[0]
        address = item.get("address", {})
        value = {
            "latitude": float(item["lat"]),
            "longitude": float(item["lon"]),
            "label": item.get("display_name") or location,
            "district": address.get("state_district") or address.get("county") or address.get("city") or location,
            "state": address.get("state") or "",
            "country": address.get("country") or "",
        }
    except Exception:
        raise HTTPException(status_code=404, detail="Location not found. Try city, district, village, or pincode.")
    return set_cached(key, value)

def normalise_location_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")

def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def vendor_category(tags: dict) -> str:
    text = " ".join(str(tags.get(k, "")).lower() for k in ["name", "shop", "amenity", "operator", "description"])
    if any(word in text for word in ["tractor", "farm equipment", "machinery", "implement"]):
        return "Farm Equipment"
    if any(word in text for word in ["irrigation", "drip", "pump", "pipe"]):
        return "Irrigation"
    if any(word in text for word in ["fertilizer", "fertiliser", "pesticide", "agro chemical", "agrochemical"]):
        return "Fertilizers & Pesticides"
    if any(word in text for word in ["seed", "nursery"]):
        return "Seeds"
    if any(word in text for word in ["soil", "lab", "testing"]):
        return "Soil Testing"
    if "garden_centre" in text or "agrarian" in text:
        return "Agri Store"
    return "AgriTech Vendor"

def overpass_query(lat: float, lon: float, radius: int, category: str) -> str:
    if category == "all":
        return f"""
        [out:json][timeout:10];
        (
          node(around:{radius},{lat},{lon})["shop"~"agrarian|garden_centre|hardware|doityourself|trade|farm",i];
          way(around:{radius},{lat},{lon})["shop"~"agrarian|garden_centre|hardware|doityourself|trade|farm",i];
        );
        out center tags 40;
        """
    category_regex = {
        "seeds": "seed|nursery|garden",
        "fertilizers": "fertili|pesticide|agro",
        "irrigation": "irrigation|drip|pump|pipe",
        "equipment": "tractor|machinery|equipment|implement",
        "soil": "soil|testing|lab",
    }.get(category, "agro|agri|seed|fertili|pesticide|tractor|irrigation|nursery|farm|soil")
    return f"""
    [out:json][timeout:12];
    (
      node(around:{radius},{lat},{lon})["shop"~"agrarian|garden_centre|hardware|doityourself|trade|farm",i];
      way(around:{radius},{lat},{lon})["shop"~"agrarian|garden_centre|hardware|doityourself|trade|farm",i];
      node(around:{radius},{lat},{lon})["name"~"{category_regex}",i];
      node(around:{radius},{lat},{lon})["amenity"="marketplace"]["name"~"{category_regex}",i];
    );
    out center tags 40;
    """

async def fetch_vendors(lat: float, lon: float, radius: int = 9000, category: str = "all") -> List[dict]:
    key = f"vendors:{round(lat, 3)}:{round(lon, 3)}:{radius}:{category}"
    cached = VENDOR_CACHE.get(key)
    if cached and time.time() - cached["created_at"] < CACHE_TTL_SECONDS:
        return cached["value"]
    query = overpass_query(lat, lon, radius, category)
    try:
        async with httpx.AsyncClient(timeout=22, headers={"User-Agent": "RaithaRakshakaAI/2.0"}) as client:
            response = await client.post("https://overpass-api.de/api/interpreter", data={"data": query})
            response.raise_for_status()
            data = response.json()
    except Exception:
        return []
    seen = set()
    vendors = []
    for item in data.get("elements") or []:
        tags = item.get("tags") or {}
        name = tags.get("name")
        item_lat = item.get("lat") or (item.get("center") or {}).get("lat")
        item_lon = item.get("lon") or (item.get("center") or {}).get("lon")
        if not name or item_lat is None or item_lon is None:
            continue
        tag_text = " ".join(str(v).lower() for v in tags.values())
        if any(blocked in tag_text for blocked in ["egg", "kitchen", "plywood", "laminate"]):
            continue
        inferred_category = vendor_category(tags)
        shop_value = str(tags.get("shop", "")).lower()
        if inferred_category == "AgriTech Vendor" and shop_value not in {"hardware", "agrarian", "garden_centre", "doityourself", "farm"}:
            continue
        dedupe = (normalise_location_key(name), round(float(item_lat), 4), round(float(item_lon), 4))
        if dedupe in seen:
            continue
        seen.add(dedupe)
        dist = distance_km(lat, lon, float(item_lat), float(item_lon))
        address = tags.get("addr:full") or ", ".join(
            part for part in [
                tags.get("addr:housename") or tags.get("addr:housenumber"),
                tags.get("addr:street"),
                tags.get("addr:suburb"),
                tags.get("addr:city") or tags.get("addr:district"),
                tags.get("addr:state"),
            ] if part
        )
        vendors.append({
            "id": f"{item.get('type')}-{item.get('id')}",
            "name": name,
            "category": inferred_category,
            "address": address or "Address available on map",
            "phone": tags.get("phone") or tags.get("contact:phone") or "",
            "rating": None,
            "opening_status": tags.get("opening_hours") or "Opening hours not listed",
            "latitude": float(item_lat),
            "longitude": float(item_lon),
            "distance_km": round(dist, 2),
            "maps_url": f"https://www.google.com/maps/search/?api=1&query={item_lat},{item_lon}",
            "source": "OpenStreetMap Overpass live data",
        })
    vendors.sort(key=lambda item: item["distance_km"])
    if not vendors:
        vendors = await fetch_nominatim_vendor_search(lat, lon, radius, category)
    result = vendors[:24]
    VENDOR_CACHE[key] = {"created_at": time.time(), "value": result}
    return result

async def fetch_nominatim_vendor_search(lat: float, lon: float, radius: int, category: str) -> List[dict]:
    terms_by_category = {
        "seeds": ["seed shop", "nursery"],
        "fertilizers": ["fertilizer shop", "pesticide shop", "agro chemicals"],
        "irrigation": ["irrigation equipment", "drip irrigation", "water pump shop"],
        "equipment": ["tractor dealer", "farm equipment", "agricultural machinery"],
        "soil": ["soil testing lab", "agriculture lab"],
        "all": ["agriculture store", "agro agency", "seed shop", "fertilizer shop", "tractor dealer", "irrigation equipment"],
    }
    region = await reverse_geocode(lat, lon)
    place = ", ".join(part for part in [region.get("district") or region.get("region"), region.get("state"), region.get("country")] if part)
    terms = terms_by_category.get(category, terms_by_category["all"])
    results = []
    seen = set()
    try:
        async with httpx.AsyncClient(timeout=8, headers={"User-Agent": "RaithaRakshakaAI/2.0"}) as client:
            for term in terms:
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={
                        "format": "jsonv2",
                        "limit": 8,
                        "addressdetails": 1,
                        "q": f"{term} {place}",
                    },
                )
                response.raise_for_status()
                for item in response.json() or []:
                    item_lat = float(item.get("lat"))
                    item_lon = float(item.get("lon"))
                    dist = distance_km(lat, lon, item_lat, item_lon)
                    if dist * 1000 > radius:
                        continue
                    name = item.get("name") or str(item.get("display_name", "")).split(",")[0]
                    if not name:
                        continue
                    dedupe = (normalise_location_key(name), round(item_lat, 4), round(item_lon, 4))
                    if dedupe in seen:
                        continue
                    seen.add(dedupe)
                    address = item.get("display_name") or "Address available on map"
                    tags = {"name": f"{name} {term}", "shop": item.get("type", "")}
                    results.append({
                        "id": f"nominatim-{item.get('place_id')}",
                        "name": name,
                        "category": vendor_category(tags),
                        "address": address,
                        "phone": "",
                        "rating": None,
                        "opening_status": "Opening hours not listed",
                        "latitude": item_lat,
                        "longitude": item_lon,
                        "distance_km": round(dist, 2),
                        "maps_url": f"https://www.google.com/maps/search/?api=1&query={item_lat},{item_lon}",
                        "source": "OpenStreetMap Nominatim live data",
                    })
    except Exception:
        return []
    results.sort(key=lambda item: item["distance_km"])
    return results

def classify_land(region: dict, lat: float, lon: float, agro: Optional[dict] = None) -> dict:
    category = str(region.get("category", "")).lower()
    osm_type = str(region.get("osm_type", "")).lower()
    address = region.get("address") or {}
    display = str(region.get("display_name", "")).lower()
    text = " ".join([category, osm_type, display, " ".join(str(v).lower() for v in address.values())])

    if any(token in text for token in ["sea", "ocean", "bay", "water", "river", "reservoir", "lake", "canal"]):
        return {
            "class": "water",
            "label": "Water body detected",
            "agriculture_allowed": False,
            "confidence": 84,
            "message": "Detected a water body. Agriculture soil analysis is not applicable here.",
        }
    if any(token in text for token in ["building", "residential", "commercial", "industrial", "road", "highway", "suburb", "city"]):
        return {
            "class": "urban",
            "label": "Urban or built-up region",
            "agriculture_allowed": False,
            "confidence": 72,
            "message": "Detected built-up or urban land. Farming analysis is limited unless this is a rooftop or peri-urban farm.",
        }
    if any(token in text for token in ["forest", "wood", "wildlife", "national park", "reserve"]):
        return {
            "class": "forest",
            "label": "Dense vegetation or forest",
            "agriculture_allowed": False,
            "confidence": 76,
            "message": "Detected dense vegetation/forest. Crop conversion may be restricted and ecological risk should be reviewed.",
        }
    if any(token in text for token in ["farm", "farmland", "field", "village", "hamlet", "agriculture", "crop"]):
        return {"class": "farmland", "label": "Agricultural/rural land", "agriculture_allowed": True, "confidence": 78, "message": "Rural or agricultural landscape detected."}

    ndvi = (agro or {}).get("ndvi", 0.4)
    if ndvi >= 0.58:
        return {"class": "vegetation", "label": "Vegetated land", "agriculture_allowed": True, "confidence": 62, "message": "Vegetation signal suggests possible farm, plantation, or green cover."}
    return {"class": "mixed_land", "label": "Mixed land parcel", "agriculture_allowed": True, "confidence": 55, "message": "No restrictive land cover detected; running agriculture suitability scan."}

async def fetch_point_weather(lat: float, lon: float) -> dict:
    key = cache_key("weather", lat, lon)
    cached = get_cached(key)
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=8) as client:
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
                timeout=4.0,
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
        async with httpx.AsyncClient(timeout=6) as client:
            resp = await asyncio.wait_for(
                client.get(
                    "https://api.open-meteo.com/v1/elevation",
                    params={"latitude": lat, "longitude": lon},
                ),
                timeout=3.0,
            )
            resp.raise_for_status()
            elevation = float((resp.json().get("elevation") or [0])[0] or 0)
    except Exception:
        elevation = round(250 + abs(math.sin(math.radians(lat * lon))) * 650)
    set_cached(key, {"elevation": elevation})
    return elevation

async def fetch_soilgrids(lat: float, lon: float) -> Optional[dict]:
    if not ENABLE_SOILGRIDS:
        return None
    key = cache_key("soilgrids", lat, lon)
    cached = get_cached(key)
    if cached:
        return cached
    try:
        params = [
            ("lat", lat),
            ("lon", lon),
            ("property", "phh2o"),
            ("property", "nitrogen"),
            ("property", "soc"),
            ("property", "clay"),
            ("property", "sand"),
            ("depth", "0-5cm"),
            ("value", "mean"),
        ]
        async with httpx.AsyncClient(timeout=6) as client:
            response = await asyncio.wait_for(
                client.get("https://rest.isric.org/soilgrids/v2.0/properties/query", params=params),
                timeout=3.5,
            )
            response.raise_for_status()
            data = response.json()
        layers = data.get("properties", {}).get("layers", [])
        values = {}
        for layer in layers:
            name = layer.get("name")
            depth = (layer.get("depths") or [{}])[0]
            mean = ((depth.get("values") or {}).get("mean"))
            if mean is not None:
                values[name] = mean
        if not values:
            return None
        ph = round(values.get("phh2o", 650) / 100, 1)
        nitrogen = round(clamp(values.get("nitrogen", 250) / 10))
        organic_carbon = round(values.get("soc", 180) / 10, 1)
        clay = round(values.get("clay", 250) / 10)
        sand = round(values.get("sand", 450) / 10)
        if clay > 35:
            soil_type = "Clay-rich black soil"
        elif sand > 55:
            soil_type = "Sandy soil"
        elif organic_carbon > 20:
            soil_type = "Organic-rich loam"
        else:
            soil_type = "Loamy agricultural soil"
        result = {
            "type": soil_type,
            "ph": ph,
            "nitrogen": nitrogen,
            "organic_carbon": organic_carbon,
            "clay": clay,
            "sand": sand,
            "source": "SoilGrids public API",
        }
        return set_cached(key, result)
    except Exception:
        return None

def apply_soilgrids(agro: dict, soilgrids: Optional[dict]) -> dict:
    if not soilgrids:
        return agro
    updated = dict(agro)
    updated["soil_type"] = soilgrids.get("type", updated["soil_type"])
    updated["soil_ph"] = soilgrids.get("ph", updated["soil_ph"])
    updated["nitrogen"] = soilgrids.get("nitrogen", updated["nitrogen"])
    updated["phosphorus"] = round(clamp(updated["phosphorus"] + soilgrids.get("organic_carbon", 0) * 0.15))
    updated["potassium"] = round(clamp(updated["potassium"] + soilgrids.get("clay", 0) * 0.12))
    updated["fertility"] = "High" if soilgrids.get("organic_carbon", 0) > 20 and updated["soil_moisture"] > 45 else updated["fertility"]
    updated["soil_source"] = soilgrids.get("source")
    return updated

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
    active_language = detect_language(req.message, req.language or "auto")
    profile = dict(req.profile or {})
    profile["preferred_language"] = active_language
    result = await orchestrator_agent.run(
        query=req.message,
        language=active_language,
        profile=profile,
    )
    if active_language != "en" and result.get("response") and not response_matches_language(result["response"], active_language):
        translated = await translate_many([result["response"]], active_language, "en")
        result["response"] = translated[0]
        result["translation_applied"] = True
    result["detected_language"] = active_language
    result["language"] = active_language
    return result

@app.post("/api/orchestrate")
async def orchestrate(req: ChatRequest):
    return await chat(req)

async def transcribe_audio_with_groq(audio_bytes: bytes, filename: str, content_type: str = "audio/webm") -> dict:
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is required for server-side voice transcription.")
    files = {
        "file": (filename or "voice.webm", audio_bytes, content_type or "audio/webm"),
    }
    data = {
        "model": os.getenv("GROQ_STT_MODEL", "whisper-large-v3"),
        "response_format": "verbose_json",
    }
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {groq_key}"},
            data=data,
            files=files,
        )
        response.raise_for_status()
        payload = response.json()
    text = payload.get("text") or ""
    detected = detect_language(text, "auto")
    return {
        "text": text,
        "detected_language": detected,
        "provider": "Groq Whisper",
        "raw_language": payload.get("language"),
    }

@app.post("/api/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...), preferred_language: str = Form("auto")):
    audio = await file.read()
    result = await transcribe_audio_with_groq(audio, file.filename or "voice.webm", file.content_type or "audio/webm")
    if preferred_language in {"en", "hi", "kn"} and not result.get("text"):
        result["detected_language"] = preferred_language
    return result

@app.post("/api/voice/chat")
async def voice_chat(
    file: UploadFile = File(...),
    preferred_language: str = Form("auto"),
    profile: str = Form("{}"),
):
    audio = await file.read()
    transcription = await transcribe_audio_with_groq(audio, file.filename or "voice.webm", file.content_type or "audio/webm")
    message = transcription.get("text", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Could not transcribe speech. Please try again closer to the microphone.")
    try:
        parsed_profile = json.loads(profile or "{}")
    except Exception:
        parsed_profile = {}
    active_language = detect_language(message, preferred_language or transcription.get("detected_language") or "auto")
    chat_result = await chat(ChatRequest(message=message, language=active_language, profile=parsed_profile))
    return {
        **chat_result,
        "transcript": message,
        "detected_language": chat_result.get("detected_language", active_language),
        "voice": {
            "tts_provider": "browser-speech-synthesis",
            "recommended_lang": {"en": "en-IN", "hi": "hi-IN", "kn": "kn-IN"}.get(active_language, "en-IN"),
            "stt_provider": transcription.get("provider"),
        },
    }

@app.post("/api/weather-data")
async def weather_data(req: LocationRequest):
    weather, region = await asyncio.gather(
        fetch_point_weather(req.latitude, req.longitude),
        reverse_geocode(req.latitude, req.longitude),
    )
    return {"latitude": req.latitude, "longitude": req.longitude, "region": region, "weather": weather, "updated_at": now_iso()}

@app.post("/api/soil-data")
async def soil_data(req: LocationRequest):
    weather, elevation, soilgrids = await asyncio.gather(
        fetch_point_weather(req.latitude, req.longitude),
        fetch_elevation(req.latitude, req.longitude),
        fetch_soilgrids(req.latitude, req.longitude),
    )
    agro = apply_soilgrids(agronomy_from_weather(weather, elevation, req.latitude, req.longitude), soilgrids)
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
            "source": agro.get("soil_source") or "Open-Meteo weather + terrain-informed agronomy model",
        },
        "updated_at": now_iso(),
    }

@app.post("/api/ndvi-analysis")
async def ndvi_analysis(req: LocationRequest):
    weather, elevation, soilgrids = await asyncio.gather(
        fetch_point_weather(req.latitude, req.longitude),
        fetch_elevation(req.latitude, req.longitude),
        fetch_soilgrids(req.latitude, req.longitude),
    )
    agro = apply_soilgrids(agronomy_from_weather(weather, elevation, req.latitude, req.longitude), soilgrids)
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
    weather, region, elevation, soilgrids = await asyncio.gather(
        fetch_point_weather(req.latitude, req.longitude),
        reverse_geocode(req.latitude, req.longitude),
        fetch_elevation(req.latitude, req.longitude),
        fetch_soilgrids(req.latitude, req.longitude),
    )
    agro = apply_soilgrids(agronomy_from_weather(weather, elevation, req.latitude, req.longitude), soilgrids)
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
    region, weather, elevation, soilgrids = await asyncio.gather(
        reverse_geocode(lat, lon),
        fetch_point_weather(lat, lon),
        fetch_elevation(lat, lon),
        fetch_soilgrids(lat, lon),
    )
    agro = apply_soilgrids(agronomy_from_weather(weather, elevation, lat, lon), soilgrids)
    land_cover = classify_land(region, lat, lon, agro)
    recommendations = ai_land_recommendations(region, weather, agro)
    if not land_cover["agriculture_allowed"]:
        recommendations = [land_cover["message"], "Select nearby rural/farm land for full crop, soil, and irrigation recommendations."]
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
        "land_cover": land_cover,
        "weather": weather,
        "soil": {
            "type": agro["soil_type"],
            "moisture": agro["soil_moisture"],
            "ph": agro["soil_ph"],
            "fertility": agro["fertility"],
            "nitrogen": agro["nitrogen"],
            "phosphorus": agro["phosphorus"],
            "potassium": agro["potassium"],
            "source": agro.get("soil_source") or "SoilGrids unavailable; terrain/weather calibrated model",
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
            agro.get("soil_source") or "terrain and weather calibrated agronomy fallback model",
        ],
    }

@app.post("/api/disease/detect")
async def detect_disease(
    file: UploadFile = File(...),
    crop: str = Form("Tomato"),
    location: str = Form("Bangalore"),
):
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

@app.get("/api/provider-status")
async def get_provider_status():
    return {"status": "ok", "providers": provider_status(), "updated_at": now_iso()}

@app.get("/api/disease/model-status")
async def disease_model_status():
    if not crop_disease_model_status:
        return {"available": False, "error": "Crop disease model module unavailable"}
    return crop_disease_model_status()

@app.get("/api/vendors")
async def vendor_search(
    location: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    radius: int = Query(9000, ge=1000, le=25000),
    category: str = Query("all"),
):
    if latitude is None or longitude is None:
        if not location:
            raise HTTPException(status_code=400, detail="Provide location text or latitude/longitude.")
        place = await geocode_location_text(location)
        latitude = place["latitude"]
        longitude = place["longitude"]
    else:
        region = await reverse_geocode(latitude, longitude)
        place = {
            "latitude": latitude,
            "longitude": longitude,
            "label": region.get("display_name") or region.get("region") or "Selected location",
            "district": region.get("district") or region.get("region") or "",
            "state": region.get("state") or "",
            "country": region.get("country") or "",
        }
    
    # Ensure latitude and longitude are floats at this point
    assert latitude is not None and longitude is not None
    vendors = await fetch_vendors(latitude, longitude, radius=radius, category=category)
    return {
        "location": place,
        "vendors": vendors,
        "count": len(vendors),
        "category": category,
        "radius_m": radius,
        "source": "OpenStreetMap Overpass live data",
        "updated_at": now_iso(),
    }

@app.post("/api/schemes/eligible")
async def get_schemes(req: SchemeRequest):
    profile = req.model_dump()
    ctx = SharedContext(query=f"Find schemes for {req.crop} farmer in {req.state}", farmer_profile=profile)
    result = await scheme_agent.run(ctx, profile)
    result["agent_flow"] = ctx.agent_flow
    return result

@app.get("/api/market/{crop}")
async def market_data(
    crop: str,
    state: str = "Karnataka",
    location: str = "Bangalore",
    district: Optional[str] = None,
    mandi: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
):
    requested_district = district or location
    profile = {
        "crop": crop,
        "state": state,
        "location": requested_district,
        "district": requested_district,
        "mandi": mandi or requested_district,
        "latitude": latitude,
        "longitude": longitude,
    }
    ctx = SharedContext(query=f"Market price for {crop}", farmer_profile=profile)
    result = await market_agent.run(
        ctx,
        crop=crop,
        state=state,
        location=requested_district,
        district=requested_district,
        mandi=mandi or requested_district,
        latitude=latitude,
        longitude=longitude,
    )
    result["agent_flow"] = ctx.agent_flow
    return result

@app.get("/api/market")
async def all_markets(
    state: str = "Karnataka",
    location: str = "Bangalore",
    district: Optional[str] = None,
    mandi: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
):
    requested_district = district or location
    crops = ["tomato", "onion", "potato", "rice", "wheat", "maize"]
    async def fetch_crop(crop: str):
        profile = {
            "crop": crop,
            "state": state,
            "location": requested_district,
            "district": requested_district,
            "mandi": mandi or requested_district,
            "latitude": latitude,
            "longitude": longitude,
        }
        ctx = SharedContext(query=f"Market price for {crop}", farmer_profile=profile)
        data = await market_agent.run(
            ctx,
            crop=crop,
            state=state,
            location=requested_district,
            district=requested_district,
            mandi=mandi or requested_district,
            latitude=latitude,
            longitude=longitude,
        )
        if data.get("available"):
            return {
                "crop": data["crop"],
                "price": data["current_price"],
                "change": data["price_change"],
                "source": data["source"],
                "location": data.get("location") or requested_district,
                "state": data.get("state") or state,
            }
        return None
    results = await asyncio.gather(*(fetch_crop(crop) for crop in crops), return_exceptions=True)
    trending = [item for item in results if isinstance(item, dict)]
    return {"trending": trending, "location": requested_district, "state": state, "updated_at": now_iso()}

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
    weather_ctx = SharedContext(query=f"Weather risk for {location}", farmer_profile=profile)
    scheme_ctx = SharedContext(query=f"Find schemes for {crop}", farmer_profile=profile)
    market_ctx = SharedContext(query=f"Market price for {crop}", farmer_profile=profile)
    weather, schemes, market = await asyncio.gather(
        weather_agent.run(weather_ctx, location=location),
        scheme_agent.run(scheme_ctx, profile),
        market_agent.run(market_ctx, crop=crop, state=state, location=location),
    )
    
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
            {"agent": "Live Dashboard Orchestrator", "status": "success", "message": "Merged weather, scheme, and market intelligence"},
            *weather_ctx.agent_flow,
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
        "providers": provider_status(),
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
