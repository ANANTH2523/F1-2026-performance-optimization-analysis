import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CarParameters, AnalysisResult, Track } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    Analyze the performance of an F1 car designed for the 2026 regulations, specifically for the provided benchmark circuit.

    **2026 Regulation Context:**
    - **Engine:** 50% ICE, 50% Electric. Total power ~1000hp. MGU-K power at 350kW.
    - **Chassis:** Smaller, lighter cars (Wheelbase 3400mm, Width 1900mm).
    - **Aerodynamics:** Active aero with 'Z-mode' (high downforce) and 'X-mode' (low drag). Reduced dirty air.
    - **Tyres:** Narrower tyres.

    **Benchmark Circuit for Simulation:**
    - **Name:** ${track.name}, ${track.country}
    - **Type:** ${track.type}
    - **Downforce Requirement:** ${track.downforceLevel}
    - **Tyre Abrasiveness:** ${track.abrasiveness}
    - **Key Features:** ${track.keyFeatures}

    **Car Parameters for Analysis:**
    - Aero Downforce Level (20-100): ${params.aeroDownforce}
    - Aero Drag Level (20-100): ${params.aeroDrag}
    - Front Wing Flap Angle (degrees): ${params.frontWingFlapAngle}
    - Suspension Stiffness (20-100): ${params.suspensionStiffness}
    - Tyre Compound (1-Soft to 5-Hard): ${params.tyreCompound}
    - ICE Power (kW): ${params.enginePowerICE}
    - MGU-K Power (kW): ${params.enginePowerMGU}
    - Battery Energy Deployment (% per lap): ${params.batteryEnergyDeployment}
    - Chassis Weight (kg): ${params.chassisWeightKg}

    **Your Task:**
    1.  Provide a JSON object containing a 'metrics' object and an 'analysis' string.
    2.  The 'metrics' must be calculated based on the car parameters in the context of the **specific track provided**.
    3.  **Crucially, calculate a 'simulatedLapTime' on the specified track: ${track.name}. The format must be a string "M:SS.mmm".**
    4.  The 'analysis' string must be a detailed report tailored to the circuit. Explain the trade-offs of this car design *for this track*. Discuss its performance profile (e.g., how it would handle specific corners or straights at ${track.name}). Provide concrete optimization suggestions relevant to the circuit's demands.
    
    Return ONLY the JSON object.
  `;
};

const buildAeroImagePrompt = (params: CarParameters): string => {
    return `
    Create a hyper-realistic, high-fidelity CFD (Computational Fluid Dynamics) visualization of the aerodynamic flow around a 2026-spec Formula 1 car.

    **Visual Style:**
    - **Primary Goal:** Mimic the output of professional engineering simulation software. This is a technical diagram, not an artistic race scene.
    - **Background:** Simple, dark, neutral background (dark gray or black).
    - **Car Representation:** The car should be a semi-transparent, ghost-like silhouette or an occlusion shadow. The focus is entirely on the airflow.

    **Aerodynamic Flow Details (CRITICAL):**
    - **Streamlines:** Render dense, precise, and thin streamlines.
    - **Color Mapping:** Use a standard scientific "Jet" colormap for air pressure.
        - **High Pressure (Red, Orange):** On the front wing leading edge and nose cone.
        - **Low Pressure (Blue, Cyan):** CRITICAL for downforce. Emphasize intense blue low-pressure zones under the car (ground effect from Venturi tunnels) and underneath the rear wing.
    - **Wake & Turbulence:** Show a complex, turbulent wake behind the car. The size and intensity MUST directly correlate with the 'Aero Drag' parameter (${params.aeroDrag}/100). High drag means a large, chaotic wake. Low drag means a clean, narrow wake (representing 'X-mode').

    **Parameter Influence:**
    - **Aero Downforce (${params.aeroDownforce}/100):** A high value must result in much more intense blue (low pressure) under the car and wings, and more aggressively angled wing elements on the silhouette (representing 'Z-mode').
    - **Front Wing Flap Angle (${params.frontWingFlapAngle} deg):** The silhouette of the front wing's flaps should visually reflect this angle. A higher angle means the flaps are more steeply angled relative to the main plane.

    The output must be a single, high-quality side-profile image.
  `;
};


export const analyzeCarPerformance = async (params: CarParameters, track: Track): Promise<AnalysisResult> => {
  try {
    const model = 'gemini-2.5-pro';
    const prompt = buildAnalysisPrompt(params, track);

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
        throw new Error("API returned an empty response for analysis.");
    }
    
    const result = JSON.parse(jsonText);

    if (!result.metrics || !result.analysis) {
        throw new Error("Invalid response format from API.");
    }

    return result as AnalysisResult;

  } catch (error) {
    console.error('Error analyzing car performance:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to get analysis from Gemini API: ${errorMessage}`);
  }
};

export const generateAeroFlowImage = async (params: CarParameters): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash-image';
        const prompt = buildAeroImagePrompt(params);

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];

        if (firstPart && firstPart.inlineData) {
            const base64ImageBytes = firstPart.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
             const blockReason = response.candidates?.[0]?.finishReason;
             if (blockReason === 'SAFETY' || blockReason === 'RECITATION' || blockReason === 'OTHER') {
                 throw new Error(`Image generation was blocked by the API. Reason: ${blockReason}`);
             }
            throw new Error('No image data received from the API.');
        }

    } catch (error) {
        console.error('Error generating aero flow image:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to generate aero flow image: ${errorMessage}`);
    }
};
