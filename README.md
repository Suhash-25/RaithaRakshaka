# RaithaRakshak AI

AI-powered farmer welfare and rural intelligence platform with a live multi-agent backend, real-time weather, smart map analysis, crop diagnostics, scheme matching, and mandi price integration.

## Live System

- Frontend: React 18 + Vite + Framer Motion + React Leaflet
- Backend: FastAPI + async Python services
- AI: Groq/OpenRouter-compatible chat synthesis, Tavily live search, local-first Ollama hooks
- Weather: Open-Meteo live forecast and elevation
- Soil: SoilGrids public API with terrain/weather-calibrated fallback only when the public service is unavailable
- Maps: OpenStreetMap, click-to-analyze, land-cover detection, crop suitability, irrigation, pest/disease risk
- Market: Agmarknet 2.0 live mandi reports filtered by crop and selected location, with Data.gov.in as fallback

## Run Backend

```powershell
cd krishi_backend
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

Health and provider status:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/api/health
Invoke-RestMethod http://127.0.0.1:8001/api/provider-status
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev -- --host=127.0.0.1 --port=5173
```

Open:

```text
http://127.0.0.1:5173
```

## Environment

Backend secrets live in `krishi_backend/.env`, which is ignored by git. Required keys:

```env
GROQ_API_KEY=
OPENROUTER_API_KEY=
TAVILY_API_KEY=
NASA_EARTHDATA_TOKEN=
DATA_GOV_API_KEY=
ENABLE_LIVE_AI=true
ENABLE_TAVILY_SEARCH=true
ENABLE_SOILGRIDS=true
ENABLE_OLLAMA_SUMMARY=false
```

Supabase memory is not enabled until both the real project API URL and an anon/service key are added:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## Main Endpoints

- `POST /api/chat`
- `POST /api/disease/detect`
- `GET /api/disease/model-status`
- `POST /api/analyze-location`
- `POST /api/weather-data`
- `POST /api/soil-data`
- `POST /api/ndvi-analysis`
- `POST /api/crop-recommendation`
- `GET /api/weather?location=Mysuru`
- `GET /api/market/Tomato`
- `GET /api/dashboard`
- `GET /api/provider-status`

## Train Crop Disease Image Model

The disease upload endpoint first tries a local MobileNetV3 classifier trained from Hugging Face dataset `vishnun0027/Crop_Disease`.
Train it once from the backend folder:

```powershell
cd krishi_backend
python train_crop_disease_model.py --epochs 8 --batch-size 16
```

For a quick smoke test, use a small subset:

```powershell
python train_crop_disease_model.py --epochs 1 --max-samples 200 --freeze-backbone
```

The checkpoint is saved to `krishi_backend/models/crop_disease_mobilenet_v3_small.pt` by default. Override with:

```env
CROP_DISEASE_MODEL_PATH=C:\path\to\crop_disease_mobilenet_v3_small.pt
```

Check readiness:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/api/disease/model-status
```

## Notes

The app avoids fake market values. Market prices now come from the public Agmarknet 2.0 report API behind `https://agmarknet.gov.in/daily-price-and-arrival-report`; if that service and the Data.gov.in fallback return no records, the UI shows a live-feed unavailable state instead of invented prices. The smart map still returns weather, terrain, land-cover, and agronomy intelligence, and labels data sources in the response.
