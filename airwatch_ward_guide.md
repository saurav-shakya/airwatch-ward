# AirWatch Ward: Getting Started Guide & Project Architecture

This document provides the foundational setup, prerequisites, folder structure, and a step-by-step execution plan to build the AirWatch Ward zero-backend SPA.

---

## 1. Prerequisites

Before writing any code, ensure your development environment is fully prepared:

### Software & Environment
* **Node.js**: v20 LTS (required for Vite 5.x)
* **Package Manager**: `npm` (v10+)
* **Python**: v3.9+ (strictly for running the offline Scikit-Learn training script; not used in the web app)
* **Git**: For version control
* **Code Editor**: VS Code (recommended extensions: Tailwind CSS IntelliSense, ESLint, Prettier)

### API Keys Required
You must obtain these three free API keys before starting:
1. **Google Gemini API Key**: Get from Google AI Studio (required for `gemini-3.0-flash`).
2. **OpenAQ v3 API Key**: Register at `explore.openaq.org`.
3. **WAQI Token**: Request at `aqicn.org/api`.

### Static Data Requirements
* **Delhi Wards GeoJSON**: Download the 2022 MCD restructuring boundaries (272 wards) from `data.gov.in`.

---

## 2. Project Initialization

Run these terminal commands to initialize the project footprint:

```bash
# 1. Scaffold Vite + React project (JavaScript or TypeScript)
npm create vite@5.4.x airwatch-ward -- --template react

# 2. Enter directory
cd airwatch-ward

# 3. Install core dependencies (React, Leaflet, Recharts, Zod)
npm install leaflet@1.9.x react-leaflet recharts@2.12.x zod@3.23.x onnxruntime-web@1.20.x

# 4. Install Tailwind CSS and its peers
npm install -D tailwindcss@3.4.x postcss autoprefixer
npx tailwindcss init -p

# 5. Create environment file
touch .env .env.example
```

Configure your `.env` file immediately (DO NOT commit this file to GitHub):
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAQ_KEY=your_openaq_api_key_here
VITE_WAQI_KEY=your_waqi_api_key_here
VITE_DEFAULT_MODE=simulated
```

---

## 3. Folder Structure

```text
airwatch-ward/
├── .env
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
│
├── offline-ml/
│   ├── train_classifier.py
│   ├── requirements.txt
│   └── synthetic_data.csv
│
├── public/
│   ├── data/
│   │   ├── delhi_wards.geojson
│   │   └── simulated_ward_profiles.json
│   └── models/
│       └── classifier.onnx
│
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    │
    ├── components/
    │   ├── MapLayer/
    │   │   ├── MapPanel.jsx
    │   │   └── LegendBar.jsx
    │   ├── WardDetail/
    │   │   ├── WardDetailPanel.jsx
    │   │   └── ForecastSparkline.jsx
    │   ├── AIAdvisory/
    │   │   ├── AdvisoryPanel.jsx
    │   │   ├── CitizenCard.jsx
    │   │   └── AdminCard.jsx
    │   └── Controls/
    │       └── SimulationControls.jsx
    │
    ├── contexts/
    │   ├── DataContext.jsx
    │   ├── SelectionContext.jsx
    │   └── AdvisoryContext.jsx
    │
    ├── services/
    │   ├── apiOpenAQ.js
    │   ├── apiWAQI.js
    │   └── apiGemini.js
    │
    └── utils/
        ├── aqiCalculator.js
        ├── haversine.js
        └── forecastEngine.js
```

---

## 4. Execution Plan

### Phase 1: The Map Foundation (Hours 1-3)
1. Add `delhi_wards.geojson` to `public/data/`.
2. Setup `MapPanel.jsx` using `react-leaflet`.
3. Render ward boundaries.
4. Implement AQI calculation.

### Phase 2: Data & Simulation (Hours 4-7)
1. Load simulated data.
2. Color-code map.
3. Integrate APIs.
4. Add simulation toggle.

### Phase 3: Machine Learning (Hours 8-10)
1. Train model in Python.
2. Export ONNX.
3. Load in React.
4. Predict pollution source.

### Phase 4: Gemini AI (Hours 11-14)
1. Setup streaming API.
2. Build prompts.
3. Render advisory UI.

### Phase 5: Polish (Hours 15-16)
1. Add charts.
2. Handle offline mode.
3. Ensure responsiveness.
