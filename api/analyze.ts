import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    metrics: {
      type: Type.OBJECT,
      properties: {
        topSpeedKmh: { type: Type.NUMBER, description: 'Estimated top speed in km/h on a long straight.' },
        brakingEfficiency: { type: Type.NUMBER, description: 'Braking performance score (0-100), considering stability and deceleration.' },
        maxCorneringG: { type: Type.NUMBER, description: 'Maximum lateral G-force achievable in high-speed corners.' },
        lowSpeedGrip: { type: Type.NUMBER, description: 'Mechanical grip score (0-100) in slow corners.' },
        tractionScore: { type: Type.NUMBER, description: 'Traction score (0-100) out of slow corners.' },
        tyreWearIndex: { type: Type.NUMBER, description: 'Tyre wear index (1-10), where 1 is minimal wear and 10 is very high wear.' },
        energyRecoveryEfficiency: { type: Type.NUMBER, description: 'Efficiency of the MGU-K energy recovery system (0-100).' },
        lapTimePotential: { type: Type.NUMBER, description: 'An index of overall lap time potential (1-10), where 1 is fastest and 10 is slowest.' },
        chassisResponsiveness: { type: Type.NUMBER, description: 'Agility and responsiveness of the chassis score (0-100).' },
        highSpeedStability: { type: Type.NUMBER, description: 'Aerodynamic stability score (0-100) in high-speed sections.' },
        simulatedLapTime: { type: Type.STRING, description: 'Simulated lap time on the specified benchmark circuit in M:SS.mmm format.' },
      },
      required: [
        "topSpeedKmh", "brakingEfficiency", "maxCorneringG", "lowSpeedGrip", 
        "tractionScore", "tyreWearIndex", "energyRecoveryEfficiency", 
        "lapTimePotential", "chassisResponsiveness", "highSpeedStability", "simulatedLapTime"
      ]
    },
    analysis: {
      type: Type.STRING,
      description: 'A detailed analysis (5-7 paragraphs) of the car\'s performance characteristics, strengths, and weaknesses based on the provided parameters AND the specific track. Use markdown for formatting with headings like **Overall Assessment**, **Strengths**, **Weaknesses**, and **Optimization Suggestions**. List key points under each heading.'
    }
  },
  required: ['metrics', 'analysis']
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

    const { params, track } = req.body;

    if (!params || !track) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze the performance of an F1 car designed for the 2026 regulations on the ${track.name} (${track.type}).
      
      Track Characteristics:
      - Downforce Level: ${track.downforceLevel}
      - Abrasiveness: ${track.abrasiveness}
      - Key Features: ${track.keyFeatures}

      Car Parameters:
      - Front Wing Angle: ${params.frontWingFlapAngle} deg
      - Aero Downforce (Index): ${params.aeroDownforce}
      - Aero Drag (Index): ${params.aeroDrag}
      - Suspension Stiffness: ${params.suspensionStiffness}
      - Tyre Compound: C${params.tyreCompound}
      - Chassis Weight: ${params.chassisWeightKg} kg
      - ICE Power: ${params.enginePowerICE} kW
      - MGU-K Power: ${params.enginePowerMGU} kW
      - Battery Deployment: ${params.batteryEnergyDeployment}%

      Provide a structured JSON response including quantitative performance metrics and a detailed textual analysis.
      Calculate a specific "Simulated Lap Time" for ${track.name} based on these parameters.
      The analysis should explain how the car fits the specific demands of ${track.name}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No data received from AI' });
    }

    const result = JSON.parse(text);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Analysis Error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
