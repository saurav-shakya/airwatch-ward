# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) or any AI assistant when working with code in this repository.

## Project Context: AirWatch Ward
**AirWatch Ward** is a zero-backend Single Page Application (SPA) providing hyper-local AQI intelligence at the municipal ward level in Delhi. It serves both citizens (health advisories) and administrators (policy recommendations).

### Core Capabilities
1. **Interactive Ward Map**: Renders Delhi wards via Leaflet using GeoJSON. Shows real-time AQI with CPCB color banding (Green to Maroon).
2. **Data Ingestion**: Pulls from OpenAQ v3 API and WAQI API, supplemented by a 10s-interval Simulation mode.
3. **ML Classifier**: Runs client-side `onnxruntime-web` to classify pollution sources (Construction Dust, Biomass Burning, Vehicular, Industrial) using a pre-trained DecisionTree model.
4. **AI Advisory**: Uses Google's `gemini-3.0-flash` (via SSE streaming) to generate plain-language health advisories and actionable policy recommendations.

## Project Architecture & Constraints

- **Zero-Backend Constraint**: NO Express, Flask, or backend servers allowed. All computation, ML inference, and external API requests must run in-browser (`fetch()`).
- **Tech Stack**: React 18, Vite 5, Tailwind CSS 3.x, Leaflet 1.9.x, react-leaflet, Recharts, Zod, onnxruntime-web.
- **Python Usage**: Python 3.9+ is ONLY used offline for training the Scikit-Learn ML classifier (`offline-ml/train_classifier.py`) and exporting to `.onnx`.
- **API Keys**: Loaded exclusively from `.env` variables (`VITE_GEMINI_API_KEY`, `VITE_OPENAQ_KEY`, `VITE_WAQI_KEY`). Never hardcode keys in source code.
- **AQI Calculation**: Use the Haversine distance to snap station readings to ward centroids (5km radius). Calculate AQI using the CPCB breakpoints (Maximum sub-index of PM2.5, PM10, NO2, CO). Wards with no stations get inverse distance weighting interpolation.

## Repository Structure

```text
airwatch-ward/
├── .env                  # API keys and config (DO NOT COMMIT)
├── public/
│   ├── data/             # delhi_wards.geojson, simulated_ward_profiles.json
│   └── models/           # classifier.onnx
├── offline-ml/           # Python scripts for offline ML training ONLY
└── src/
    ├── main.jsx / App.jsx
    ├── components/
    │   ├── MapLayer/     # MapPanel.jsx, LegendBar.jsx
    │   ├── WardDetail/   # WardDetailPanel.jsx, ForecastSparkline.jsx
    │   ├── AIAdvisory/   # AdvisoryPanel.jsx, CitizenCard.jsx, AdminCard.jsx
    │   └── Controls/     # SimulationControls.jsx
    ├── contexts/         # DataContext, SelectionContext, AdvisoryContext
    ├── services/         # apiOpenAQ.js (v3 ONLY), apiWAQI.js, apiGemini.js
    └── utils/            # aqiCalculator.js, haversine.js, forecastEngine.js
```

## Critical Rules for AI Assistants

1. **OpenAQ API Versioning**: Use **v3 ONLY** (`api.openaq.org/v3/`). v1 and v2 are deprecated. Endpoints to use: `/v3/locations`, `/v3/sensors/{id}/hours`, `/v3/measurements`.
2. **Gemini Integration**: Must use model `gemini-3.0-flash` with max 600 tokens. Output must be structured JSON (`responseMimeType: "application/json"`) containing keys like `citizen_advisory`, `policy_recommendation`, `urgency`, `projected_aqi_reduction`, `confidence`. Must stream via SSE (`?alt=sse`).
3. **Machine Learning**: Do not build Python backend APIs for the ML model. The model (`classifier.onnx`) must be loaded and executed in the browser via `onnxruntime-web`.
4. **No Server-Side Code**: You must refuse any request to build a Node.js/Express/Python backend for the active features. Everything happens client-side.
5. **Styling**: Strictly adhere to Tailwind CSS for styling. Ensure responsive design satisfying both citizen mobile views (375px+) and admin dashboard views (1280px+).

## Common Commands
```bash
npm run dev      # Start Vite dev server
npm run build    # Build production SPA
npm run preview  # Preview production build locally
```