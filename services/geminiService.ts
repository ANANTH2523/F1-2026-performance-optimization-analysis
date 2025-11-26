import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CarParameters, AnalysisResult, Track, SensitivityDataPoint } from './types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
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

export const performSensitivityAnalysis = async (
  baseParams: CarParameters,
  track: Track,
  variable: keyof CarParameters,
  min: number,
  max: number,
  steps: number
): Promise<SensitivityDataPoint[]> => {
  try {
    const ai = getAiClient();
    
    // Create a range of values to guide the AI
    const stepSize = (max - min) / (steps - 1);
    const rangeValues = Array.from({ length: steps }, (_, i) => Math.round(min + i * stepSize));

    const prompt = `
      Perform a precise parameter sensitivity analysis for a 2026 F1 car simulation.
      
      Context:
      - Circuit: ${track.name} (${track.type})
      - Variable Parameter: "${String(variable)}"
      - Sweep Range: ${min} to ${max} (Steps: ${steps})
      
      Base Configuration (Held Constant):
      ${JSON.stringify({ ...baseParams, [variable]: "VARIABLE" }, null, 2)}

      Task:
      Simulate the car performance at these specific values for "${String(variable)}": [${rangeValues.join(', ')}].
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
    if (!text) throw new Error("No sensitivity data received from AI.");
    
    const parsed = JSON.parse(text);
    return parsed.results as SensitivityDataPoint[];

  } catch (error) {
    console.error("Sensitivity Analysis Error:", error);
    throw error;
  }
};

export const generateAeroFlowImage = async (params: CarParameters, track: Track): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Create a futuristic, high-contrast CFD (Computational Fluid Dynamics) simulation image of a 2026 Formula 1 car, top-down view.
      
      Simulation Context:
      - Circuit: ${track.name} (${track.country}).
      - Environmental Physics: Simulate air density and skin friction corresponding to ${track.country}'s climate. Account for ambient track temperature affecting airflow viscosity.
      
      Aesthetics:
      - Deep dark void/blueprint background.
      - The car should be rendered as a sleek, metallic or wireframe silhouette.
      - NEON COLORED aerodynamic streamlines (glowing cyan, electric blue, and intense red for high pressure areas) flowing dynamically over the body.
      - High-tech, digital engineering look.
      - **Particle Systems**: Integrate subtle, luminescent particle tracers within the streamlines. Use elongated motion-blur particles to denote high-velocity airflow (low pressure), and denser, slower-moving particle clusters in high-pressure drag zones (e.g., behind tires or rear wing).
      
      Parameter Visualization:
      - Front Wing Angle: ${params.frontWingFlapAngle} degrees (show flow disruption at the nose).
      - Downforce: ${params.aeroDownforce}/100 (if > 70, show intense red/orange pressure zones on wings/floor; if < 40, show mostly blue/green smooth flow).
      - Drag: ${params.aeroDrag}/100 (visualize the wake/turbulence behind the car; larger/chaotic wake for high drag).
      
      The image should look like it came from advanced F1 simulation software with real-time particle physics.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9'
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    return '';
  } catch (error) {
    console.error("Image Gen Error:", error);
    return ''; 
  }
};