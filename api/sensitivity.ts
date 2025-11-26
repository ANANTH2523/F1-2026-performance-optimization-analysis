import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const sensitivitySchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          paramValue: { type: Type.NUMBER },
          metrics: {
            type: Type.OBJECT,
            properties: {
               topSpeedKmh: { type: Type.NUMBER },
               maxCorneringG: { type: Type.NUMBER },
               lapTimePotential: { type: Type.NUMBER },
               tyreWearIndex: { type: Type.NUMBER },
               simulatedLapTime: { type: Type.STRING }
            }
          }
        }
      }
    }
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { baseParams, track, variable, min, max, steps } = req.body;

    if (!baseParams || !track || !variable || min === undefined || max === undefined || !steps) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Create a range of values to guide the AI
    const stepSize = (max - min) / (steps - 1);
    const rangeValues = Array.from({ length: steps }, (_, i) => Math.round(min + i * stepSize));

    const prompt = `
      Perform a precise parameter sensitivity analysis for a 2026 F1 car simulation.
      
      Context:
      - Circuit: ${track.name} (${track.type})
      - Variable Parameter: "${variable}"
      - Sweep Range: ${min} to ${max} (Steps: ${steps})
      
      Base Configuration (Held Constant):
      ${JSON.stringify({ ...baseParams, [variable]: "VARIABLE" }, null, 2)}

      Task:
      Simulate the car performance at these specific values for "${variable}": [${rangeValues.join(', ')}].
      Return the resulting performance metrics for each step.

      PHYSICS RULES TO ENFORCE:
      1. Consistency: The metrics must show a smooth, logical trend (e.g., linear or curve). Do not output random noise.
      2. Aero Downforce: Increasing this MUST significantly INCREASE 'maxCorneringG' and DECREASE 'topSpeedKmh' (due to drag). Lap time should generally improve unless drag penalty is too high.
      3. Aero Drag: Increasing this MUST DECREASE 'topSpeedKmh'.
      4. Engine Power: Increasing this MUST INCREASE 'topSpeedKmh' and IMPROVE 'lapTimePotential'.
      5. Weight: Increasing this MUST WORSEN 'maxCorneringG', 'brakingEfficiency' (internal calc), and 'lapTimePotential'.
      
      Return a JSON object with a "results" array containing the data points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: sensitivitySchema,
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No sensitivity data received from AI' });
    }
    
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Sensitivity Analysis Error:', error);
    return res.status(500).json({ 
      error: 'Sensitivity analysis failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
