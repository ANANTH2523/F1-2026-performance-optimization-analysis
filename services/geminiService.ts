import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CarParameters, AnalysisResult } from './types';

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
      },
      required: [
        "topSpeedKmh", "brakingEfficiency", "maxCorneringG", "lowSpeedGrip", 
        "tractionScore", "tyreWearIndex", "energyRecoveryEfficiency", 
        "lapTimePotential", "chassisResponsiveness", "highSpeedStability"
      ]
    },
    analysis: {
      type: Type.STRING,
      description: 'A detailed analysis (5-7 paragraphs) of the car\'s performance characteristics, strengths, and weaknesses based on the provided parameters. Use markdown for formatting with headings like **Overall Assessment**, **Strengths**, **Weaknesses**, and **Optimization Suggestions**. List key points under each heading.'
    }
  },
  required: ['metrics', 'analysis']
};

const buildAnalysisPrompt = (params: CarParameters): string => {
  return `
    Analyze the performance of an F1 car designed for the 2026 regulations based on the following parameters.

    **2026 Regulation Context:**
    - **Engine:** 50% ICE (Internal Combustion Engine), 50% Electric (MGU-K). Total power around 1000hp. MGU-K power increased to 350kW.
    - **Chassis:** Smaller and lighter cars. Wheelbase reduced from 3600mm to 3400mm. Width reduced from 2000mm to 1900mm. Minimum weight reduced by ~40-50kg.
    - **Aerodynamics:** Active aerodynamics with movable front and rear wings. 'Z-mode' for high downforce in corners, 'X-mode' for low drag on straights. Simpler endplates and reduced outwash to minimize dirty air.
    - **Tyres:** Narrower tyres than the current generation.

    **Car Parameters for Analysis:**
    - Aero Downforce Level (20-100): ${params.aeroDownforce} (Higher means more cornering grip but more drag)
    - Aero Drag Level (20-100): ${params.aeroDrag} (Lower means higher top speed but less downforce)
    - Suspension Stiffness (20-100): ${params.suspensionStiffness} (Affects mechanical grip and stability)
    - Tyre Compound (1-Soft to 5-Hard): ${params.tyreCompound}
    - ICE Power (kW): ${params.enginePowerICE}
    - MGU-K Power (kW): ${params.enginePowerMGU}
    - Battery Energy Deployment (% per lap): ${params.batteryEnergyDeployment}
    - Chassis Weight (kg): ${params.chassisWeightKg}

    **Your Task:**
    1.  Provide a JSON object containing a 'metrics' object and an 'analysis' string.
    2.  The 'metrics' object must contain the calculated performance metrics based on the car parameters and regulation context. Adhere strictly to the provided schema.
    3.  The 'analysis' string should be a detailed, insightful report. Explain the trade-offs in this car's design. Discuss its likely performance profile on different track types (e.g., high-speed like Monza vs. twisty like Monaco). Provide concrete optimization suggestions.
    
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

    The output must be a single, high-quality side-profile image.
  `;
};


export const analyzeCarPerformance = async (params: CarParameters): Promise<AnalysisResult> => {
  try {
    const model = 'gemini-2.5-pro';
    const prompt = buildAnalysisPrompt(params);

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
