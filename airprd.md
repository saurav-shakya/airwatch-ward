# PRODUCT REQUIREMENTS DOCUMENT
**AirWatch Ward · v1.0**
**Project:** AirWatch Ward  
**Event:** India Innovates 2026  
**Status:** Active — Hackathon Build  

---

## 1. Executive Summary
India's urban air quality monitoring infrastructure reports a single citywide AQI average — a figure that masks dangerous, ward-level pollution spikes. A resident living 400 metres from a construction site, landfill, or biomass-burning zone receives the same advisory as a resident in a green belt across the city. Administrators have no real-time, granular data to deploy corrective action before a health crisis materialises.

AirWatch Ward addresses this gap by delivering hyper-local AQI intelligence at the municipal ward level. The platform ingests real-time sensor data, classifies pollution sources using an on-device machine learning model, generates AI-powered advisories via the Gemini API, and renders everything on an interactive ward-level heatmap. It serves two distinct audiences simultaneously: citizens who need plain-language health guidance, and administrators who need actionable, ward-specific policy recommendations.

**Impact context**
Delhi alone records 54,000+ premature deaths annually attributable to air pollution. Hyper-local intelligence enables proactive governance — deploying water sprinklers, restricting heavy vehicles, or issuing targeted citizen advisories — before AQI reaches crisis thresholds.

---

## 2. Problem Statement

### 2.1 Current state
State and municipal dashboards (CPCB, SAFAR, ITO monitors) aggregate pollutant readings into a single citywide or zone-level AQI number. This creates three compounding failures:
* **Spatial masking:** High-AQI micro-zones near construction, landfills, and biomass-burning sites are averaged away. A ward recording AQI 380 looks identical to a ward recording AQI 120 in city-level dashboards.
* **Source ambiguity:** Existing systems report what pollution levels are, not why they are elevated. Without source attribution (construction dust vs. vehicular exhaust vs. burning), administrators cannot select the correct intervention.
* **Reactive governance:** Advisories are issued hours after a spike, when health damage is already occurring. There is no mechanism for forward-looking, ward-specific alerts.

### 2.2 Who is affected
| Stakeholder | Pain point | Desired outcome |
| :--- | :--- | :--- |
| **Delhi/urban residents** | Generic citywide advisories with no localised guidance | Ward-specific health advisories in plain language |
| **Municipal administrators**| No real-time data to justify or target interventions | Automated policy recommendations with projected impact |
| **Health & policy researchers**| Coarse historical data, no source attribution | Ward-level pollution attribution and trend data |

---

## 3. Goals and Non-Goals

### 3.1 Goals
* Visualise air quality at the ward level across Delhi in real time, with AQI colour-coded from Green to Maroon per CPCB methodology.
* Classify the likely source of each pollution spike — construction dust, biomass burning, vehicular emissions, or industrial — using an on-device ML classifier.
* Generate AI-powered, ward-specific health advisories for citizens and actionable policy recommendations for administrators via Google Gemini 3.0 Flash.
* Provide a 6-hour forward-looking AQI forecast per ward to enable proactive rather than reactive governance.
* Operate without a backend server during the hackathon — all processing client-side or via direct API calls.
* Demonstrate real-world feasibility by ingesting live data from OpenAQ v3 and WAQI APIs, supplemented by a realistic simulation mode.

### 3.2 Non-Goals
* Production-grade IoT sensor deployment across Delhi wards — out of scope for this prototype.
* SMS or WhatsApp push notifications — identified as a future upgrade path but not required for the hackathon demo.
* Historical trend analytics dashboard with multi-month views — a post-hackathon feature.
* Multi-city deployment beyond Delhi in v1.0.
* User authentication, persistent accounts, or saved preferences.

---

## 4. User Personas

**Persona A — Priya, 34, Rohini resident**
Priya lives in Ward 94 (Rohini, Delhi) near an active construction cluster. She checks her phone before her morning walk. She wants to know, in plain language, whether it is safe to exercise outdoors today and whether her children should wear masks. She has no interest in PM2.5 values — she needs a verdict and a reason.

**Persona B — Rajiv, 47, Delhi MCD Environment Officer**
Rajiv oversees enforcement of anti-pollution ordinances across North Delhi. He needs to justify the deployment of mechanised sweepers and water sprinklers to his district commissioner. He requires ward-level data, a source attribution, and a quantified projection of the AQI impact of each intervention — not a wall of numbers.

**Persona C — Dr Meghna, 41, TERI air quality researcher**
Meghna studies the correlation between biomass-burning events and respiratory hospital admissions in Delhi. She needs time-of-day, ward-type, and spike-pattern data exported in a structured format. She will contribute simulated sensor data to validate the classifier.

---

## 5. Feature Requirements

| ID | Requirement | Pri | Notes |
| :--- | :--- | :--- | :--- |
| **FR-01** | Ward-level AQI heatmap rendered on Leaflet.js with Delhi ward GeoJSON boundaries. Colour bands: Green (<50), Yellow (51-100), Orange (101-150), Red (151-200), Purple (201-300), Maroon (>300). | **P0** | CPCB AQI scale |
| **FR-02** | Click-to-drill interaction on any ward shows a detail panel: pollutant breakdown (PM2.5, PM10, NO2, CO), detected source, AQI value, and 6-hour forecast sparkline. | **P0** | Core UX |
| **FR-03** | Real-time data ingestion from OpenAQ v3 API (bounding box query, hourly averages) and WAQI API (500+ India stations). | **P0** | OpenAQ v3 required — v1/v2 deprecated |
| **FR-04** | Simulation mode: AQI values update ward-by-ward every 10 seconds with realistic variance. Toggle between Live and Simulated. | **P0** | Demo resilience |
| **FR-05** | Pollution source classifier: classifies each ward spike as Construction Dust, Biomass Burning, Vehicular, or Industrial using an ONNX.js decision-tree model. | **P0** | Runs client-side |
| **FR-06** | Citizen advisory card: plain-language health advisory ('Avoid outdoor exercise', 'Wear N95 mask') generated by Gemini 3.0 Flash, streamed token-by-token into the UI. | **P0** | Streaming required |
| **FR-07** | Admin policy panel: structured policy recommendations (e.g., 'Deploy water sprinklers on Rohini Sector 11 ring road') with urgency level and projected AQI reduction, generated by Gemini 3.0 Flash. | **P0** | Structured output |
| **FR-08** | Policy Impact Preview: for each admin recommendation, display projected AQI reduction if adopted (e.g., '-35 AQI units in 2 hours'). | **P1** | Differentiator |
| **FR-09** | 6-hour AQI forecast per ward using last 24h hourly averages from OpenAQ v3 and a simple moving-average extrapolation. | **P1** | Upgrade #2 |
| **FR-10** | Dual-audience UI: separate Citizen view and Admin view accessible via a top-level toggle. | **P1** | Hackathon UX |
| **FR-11** | Responsive design: usable on a laptop (1280px+) for hackathon demo and a mobile browser (375px+) for citizen use case. | **P2** | Tailwind responsive |
| **FR-12** | All API keys loaded from environment variables / .env; never hardcoded in source. | **P1** | Security hygiene |

---

## 6. Advisory Logic & Gemini Prompt Specification

### 6.1 Gemini API call parameters
| Parameter | Value |
| :--- | :--- |
| **Model** | `gemini-3.0-flash` |
| **Max tokens** | 600 |
| **Streaming** | true — SSE stream piped to UI token-by-token (via `?alt=sse`) |
| **Response format** | JSON via `responseMimeType: "application/json"`. Keys: `citizen_advisory`, `policy_recommendation`, `urgency` (low/medium/high/critical), `projected_aqi_reduction`, `confidence`. |

### 6.2 Prompt template (admin + citizen combined call)
**System Instruction:**
> You are AirWatch Ward, an air quality intelligence assistant for Indian municipal administrators and citizens. You receive structured JSON data about a specific Delhi ward. You must respond ONLY with a valid JSON object containing exactly these keys: `citizen_advisory` (string, plain-language, max 60 words), `policy_recommendation` (string, specific and actionable, max 80 words), `urgency` (one of: low / medium / high / critical), `projected_aqi_reduction` (integer, estimated AQI units reduction if recommendation is followed within 2 hours), `confidence` (percentage integer). No prose. No markdown. No preamble.

**User prompt template:**
> Ward: {ward_name} | Zone type: {zone_type} | Current AQI: {aqi} | PM2.5: {pm25} ug/m3 | PM10: {pm10} ug/m3 | NO2: {no2} ug/m3 | Time: {hour}:00 IST | Day: {day_of_week} | Detected source: {source_label} | Classifier confidence: {confidence}% | 6h forecast peak: AQI {forecast_peak} at {forecast_time} IST | Previous 24h average: {avg_24h}

---

## 7. Success Metrics (Hackathon Scope)
* Live demo completes a full cycle — ward selection, source detection, Gemini advisory generation — without error in front of judges.
* At least 80% of Delhi wards display a non-null AQI value during demo (live + simulated fallback combined).
* Gemini advisory streams visibly within 3 seconds of ward selection.
* Simulation mode runs uninterrupted for 5+ minutes showing dynamic AQI evolution.
* Admin and citizen views are clearly differentiated and accessible without explanation from the presenter.

---

## 8. Constraints and Assumptions

### 8.1 Constraints
* **Zero-backend constraint:** No Express, Flask, or Firebase server. All processing runs client-side or via browser `fetch()` to external APIs.
* **Hackathon timeline:** Full working prototype required within 16 hours from document creation.
* **API rate limits:** OpenAQ v3 free tier — 60 requests/minute. WAQI free tier — 1000 requests/day. Gemini API — 3.0 Flash standard tier.
* **GeoJSON:** Ward boundaries sourced from data.gov.in; last updated for Delhi's 272 wards (MCD restructuring 2022).

### 8.2 Assumptions
* Judges will be evaluating on a laptop with a stable internet connection. Live API calls are acceptable.
* The ONNX classifier is pre-trained offline in scikit-learn and exported to `.onnx` before the hackathon build begins.
* Simulated sensor data is pre-computed with realistic variance patterns matching known Delhi ward types and time-of-day profiles.
* The WAQI API key, OpenAQ API key, and Gemini API key are obtained and validated before build begins.