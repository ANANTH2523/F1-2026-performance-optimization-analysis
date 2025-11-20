import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CarParameters, AnalysisResult, Track } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

const getAiClient = () => {
  if (!API_KEY) {
    throw new Error("API Key Missing: Please create a .env file in the project root and add VITE_GOOGLE_AI_API_KEY=your_key_here");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

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

const buildAnalysisPrompt = (params: CarParameters, track: Track): string => {
  return `
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
};

export const analyzeCarPerformance = async (params: CarParameters, track: Track): Promise<AnalysisResult> => {
  try {
    const ai = getAiClient();
    const prompt = buildAnalysisPrompt(params, track);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data received from AI.");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const generateAeroFlowImage = async (params: CarParameters): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      A high-tech, photorealistic CFD (Computational Fluid Dynamics) visualization of a 2026 Formula 1 car from a top-down view.
      
      Visual Style:
      - Scientific visualization style with a dark background.
      - The car body should be outlined in white or metallic grey.
      - Show distinct aerodynamic streamlines flowing over the car.
      
      Parameter Visualization:
      - Front Wing Angle is ${params.frontWingFlapAngle} degrees (visualize air disruption at the front).
      - Downforce level is ${params.aeroDownforce}/100 (show ${params.aeroDownforce > 60 ? 'intense red/orange pressure zones' : 'blue/green lower pressure zones'} on the wings and floor).
      - Drag level is ${params.aeroDrag}/100 (visualize the turbulent wake behind the car; ${params.aeroDrag > 60 ? 'large, chaotic wake' : 'narrow, clean wake'}).
      
      The image should look like a professional engineering simulation result.
    `;

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
      },
    });

    const base64Image = response.generatedImages[0]?.image?.imageBytes;
    if (!base64Image) throw new Error("Failed to generate image");

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error("Image Gen Error:", error);
    // Return null to handle gracefully in UI instead of crashing analysis
    return '';
  }
};
