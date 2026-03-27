# TECHNICAL REQUIREMENTS DOCUMENT
**AirWatch Ward · v1.0**

---

## 1. System Architecture Overview
AirWatch Ward is a single-page application (SPA) with a zero-backend constraint. All computation — ML inference, data normalisation, AQI calculation, and map rendering — executes in the browser. External API calls are made directly from the client using `fetch()`, with CORS-compatible endpoints. The Gemini API call is the only stateful external call; all others are read-only data fetches.

| Layer | Components |
| :--- | :--- |
| **Data ingestion** | OpenAQ v3 REST API · WAQI REST API · Simulated IoT ward data (JSON) |
| **Normalisation** | Ward centroid snap algorithm · CPCB AQI formula (breakpoints per pollutant) · Moving-average forecast engine |
| **ML inference** | ONNX Runtime Web (onnxruntime-web) · Pre-trained scikit-learn DecisionTreeClassifier exported to ONNX |
| **AI advisory** | Google Gemini 3.0 Flash · Streaming SSE · Structured JSON output (`responseMimeType`) |
| **Map rendering** | Leaflet.js 1.9.x · Delhi ward GeoJSON · Choropleth layer with AQI colour scale |
| **UI framework** | React 18 (Vite) · Tailwind CSS 3.x · Recharts (forecast sparkline) |
| **Build toolchain** | Vite 5.x · Node.js 20 LTS · npm |

---

## 2. Data Layer

### 2.1 OpenAQ v3 API
All calls must use `api.openaq.org/v3/`. The v1 and v2 endpoints were deprecated and return HTTP 410 as of 31 January 2025. Authentication requires an `X-API-Key` header obtained from explore.openaq.org.
* **Key endpoints used:**
  * `GET /v3/locations?bbox={south},{west},{north},{east}&limit=100` — fetch all monitoring stations within Delhi bounding box (28.4,76.8,28.9,77.4)
  * `GET /v3/sensors/{id}/hours?limit=24` — last 24 hours of hourly averages for a sensor, used for forecast calculation
  * `GET /v3/measurements?locations_id={id}&limit=1` — most recent measurement for live AQI display

### 2.2 WAQI API
Used as a supplementary data source to fill coverage gaps in Delhi where OpenAQ has sparse stations. Free API key available at aqicn.org/api. Returns AQI, PM2.5, PM10, NO2, CO, and O3 per station. 
* **WAQI bounding box endpoint:**
  * `GET https://api.waqi.info/map/bounds/?latlng=28.4,76.8,28.9,77.4&token={KEY}` 
  * Response: array of `{ lat, lon, aqi, station: { name, url } }` 
  * Snap each station to nearest ward centroid using Haversine distance.

### 2.3 Ward centroid snap algorithm
Each API station reading is associated with a ward by computing the Haversine distance between the station coordinates and each ward centroid (precomputed from GeoJSON). The nearest ward within a 5km radius receives the reading. If multiple stations map to one ward, readings are averaged. Wards with no station within 5km receive an interpolated value from the 3 nearest wards (inverse distance weighting).

### 2.4 AQI calculation
Raw pollutant concentrations (PM2.5, PM10, NO2, CO) are converted to sub-indices using the CPCB AQI breakpoint table. The ward AQI is the maximum sub-index across all measured pollutants, consistent with CPCB methodology. Breakpoints are hardcoded as a constant lookup table in the codebase.

### 2.5 Simulated IoT data
A precomputed JSON dataset of 272 Delhi wards is included in the codebase. Each ward has a base AQI profile keyed by hour-of-day and ward type (industrial, residential, green belt, mixed). Random variance (±15%) is applied at runtime to simulate sensor readings. The simulation updates every 10 seconds. This is the fallback when live API calls fail or rate limits are hit.

---

## 3. Machine Learning Engine

### 3.1 Classifier specification
| Attribute | Detail |
| :--- | :--- |
| **Algorithm** | DecisionTreeClassifier (scikit-learn 1.4+) |
| **Training data** | Synthetic dataset: 2,000 samples per class, features derived from known pollution signatures |
| **Classes** | Construction Dust · Biomass Burning · Vehicular · Industrial |
| **Input features** | PM2.5/PM10 ratio · NO2 concentration · CO level · Hour of day (0-23) · Ward type (0-3 encoded) · AQI spike delta (current vs 3h moving avg) |
| **Deployment** | Exported to ONNX via `sklearn2onnx`. Loaded in-browser via `onnxruntime-web` (wasm backend) |
| **Inference latency** | Target <50ms per ward on mid-range laptop |
| **Model file** | `classifier.onnx` — bundled in `/public/models/` |

### 3.2 Feature engineering rationale
* **PM2.5/PM10 ratio:** Construction dust produces high PM10 relative to PM2.5 (coarse particles). Biomass burning elevates both roughly equally. Vehicular emissions skew heavily towards PM2.5.
* **Hour of day:** Biomass burning peaks 6–9am and 6–9pm (cooking/heating). Vehicular emissions peak 8–10am and 5–8pm. Construction dust peaks 9am–6pm weekdays.
* **AQI spike delta:** A sudden spike (>50 AQI units in 1 hour) compared to 3-hour baseline is a strong signal for a discrete event (burning, construction start) vs. gradual traffic buildup.

### 3.3 Training script
**`train_classifier.py` — run offline before hackathon**
```python
from sklearn.tree import DecisionTreeClassifier
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# Load synthetic dataset -> train model -> export
clf = DecisionTreeClassifier(max_depth=8, min_samples_leaf=10)
clf.fit(X_train, y_train)

onnx_model = convert_sklearn(clf, 'classifier', [('input', FloatTensorType([None, 6]))])
with open('public/models/classifier.onnx', 'wb') as f:
    f.write(onnx_model.SerializeToString())