// src/services/ai.js

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function fetchAIAdvisory(wardData) {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    return {
      error: "Gemini API Key missing. Please add VITE_GEMINI_API_KEY to your .env file."
    };
  }

  const payload = {
    contents: [{
      parts: [{
        text: `You are the Delhi DPCC (Delhi Pollution Control Committee) Administrator Assistant, responsible for enforcing GRAP (Graded Response Action Plan). 
        You have received the following real-time data for a ward in Delhi:
        
        Ward Name: ${wardData.ward_name}
        Ward Number: ${wardData.ward_no}
        Zone: ${wardData.zone}
        Current AQI: ${wardData.aqi}
        Primary Pollutant Source: ${wardData.source}
        PM2.5 Level: ${wardData.pm25} µg/m³
        
        Based on this data, provide a structured JSON response with exactly three keys:
        1. "citizen_advisory": A short (max 20 words) plain-language health advisory for residents.
        2. "grap_warning": A precise assessment of the GRAP stage violation based on the AQI (e.g., "GRAP Stage III - Severe AQI > 400" or "No GRAP Violation - Good AQI"). Be concise.
        3. "policy_action": A specific, actionable policy recommendation for the municipality (e.g., "Deploy mechanised sweepers", "Halt non-essential construction", "Issue fine for biomass burning").
        
        ONLY output valid JSON without any markdown code blocks or wrapper text.`
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    const textOutput = data.candidates[0].content.parts[0].text;
    
    try {
      return JSON.parse(textOutput);
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON:", textOutput);
      return { error: "Failed to parse AI response." };
    }
    
  } catch (error) {
    console.error("Error fetching AI Advisory:", error);
    return {
      error: "Could not connect to AI service. Please try again later."
    };
  }
}
