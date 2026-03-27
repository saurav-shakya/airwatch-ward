# 🌬️ AirWatch Ward

**Hyper-local AQI Intelligence at the Municipal Ward Level**  
*Built for India Innovates 2026 Hackathon*

AirWatch Ward addresses the gap in urban air quality monitoring by delivering granular AQI intelligence for each of Delhi's 272 municipal wards. It uses on-device ML for pollution source classification and Google's Gemini AI to provide actionable health advisories and policy recommendations.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **Package Manager**: `npm`
- **API Keys**: You will need free keys for Gemini, OpenAQ, and WAQI.

### 2. Installation
```bash
# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (copy from `.env.example` if available):

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAQ_KEY=your_openaq_api_key_here
VITE_WAQI_KEY=your_waqi_api_key_here
VITE_DEFAULT_MODE=simulated
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5
- **Styling**: Tailwind CSS 3.x
- **Maps**: Leaflet.js & React-Leaflet
- **AI/ML**: 
  - **Google Gemini 3.0 Flash**: For streaming health and policy advisories.
  - **ONNX Runtime Web**: Client-side inference for pollution source classification.
- **Charts**: Recharts (for AQI trends and forecasts)
- **Validation**: Zod

---

## 📂 Project Structure

```text
airwatch-ward/
├── public/               # Static assets (GeoJSON, ML models)
├── src/
│   ├── components/       # UI Components (MapLayer, WardDetail, AIAdvisory)
│   ├── contexts/         # React Contexts for global state management
│   ├── services/         # API Service integrations (Gemini, OpenAQ, WAQI)
│   ├── utils/            # AQI calculators and helper functions
│   ├── App.jsx           # Main application layout
│   └── main.jsx          # Entry point
├── offline-ml/           # Python scripts for offline model training (not for web)
├── CLAUDE.md             # AI coding assistant guidelines
└── README.md             # Project documentation (you are here)
```

---

## 💡 Key Features

- **Interactive Ward Map**: Real-time AQI visualization across Delhi wards using choropleth overlays.
- **AI-Powered Advisories**: Streaming health advice for citizens and policy recommendations for municipal officers via Gemini.
- **Source Classification**: Identifies if pollution is coming from construction, biomass burning, vehicular, or industrial sources.
- **Simulation Mode**: Dynamic data simulation for testing and demonstrations when live sensor data is sparse.

---

## 🤝 Contributing
1. Ensure all API keys are kept in `.env` and never committed.
2. Follow the architectural rules defined in `CLAUDE.md`.
3. Use Tailwind for all styling needs.
