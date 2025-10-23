import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CarParameters, AnalysisResult, Annotation } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const analysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        text: {
            type: Type.STRING,
            description: "A detailed textual analysis of the car's performance characteristics, strengths, and weaknesses. Use markdown-like formatting: **Title** for headings, and '-' for list items."
        },
        metrics: {
            type: Type.OBJECT,
            properties: {
                lapTimePotential: { type: Type.NUMBER, description: 'Scale of 1-100, lower is better.' },
                topSpeedKmh: { type: Type.NUMBER, description: 'The car\'s estimated top speed in km/h.' },
                maxCorneringG: { type: Type.NUMBER, description: 'The maximum lateral G-force the car can sustain in corners.' },
                tyreWearIndex: { type: Type.NUMBER, description: 'A score from 1-100 indicating how quickly the tyres will degrade. Higher is worse.' },
                brakingEfficiency: { type: Type.NUMBER, description: 'A score from 1-100 indicating the car\'s braking performance and stability. Higher is better.' },
                lowSpeedGrip: { type: Type.NUMBER, description: 'A score from 1-100 indicating mechanical grip in slow corners. Higher is better.' },
                energyRecoveryEfficiency: { type: Type.NUMBER, description: 'A score from 1-100 for the efficiency of the MGU-K in harvesting and deploying energy. Higher is better.' },
                tractionScore: { type: Type.NUMBER, description: 'A score from 1-100 for the car\'s ability to apply power on corner exit without wheelspin. Higher is better.' },
            },
            required: ['lapTimePotential', 'topSpeedKmh', 'maxCorneringG', 'tyreWearIndex', 'brakingEfficiency', 'lowSpeedGrip', 'energyRecoveryEfficiency', 'tractionScore'],
        }
    },
    required: ['text', 'metrics']
};

const annotationsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            partName: { type: Type.STRING, description: 'The name of the F1 car component.' },
            description: { type: Type.STRING, description: 'A brief, one-sentence description of the primary change or impact on this component based on the parameters.' }
        },
        required: ['partName', 'description']
    }
};

export const analyzeCarPerformance = async (params: CarParameters): Promise<AnalysisResult> => {
  const model = "gemini-2.5-pro";
  const systemInstruction = "You are an expert F1 race engineer and performance analyst. Your task is to analyze a car configuration for the 2026 regulations and provide a detailed performance breakdown. You must return your analysis in a specific JSON format containing both a textual summary and key performance metrics.";
  const prompt = `Analyze the following F1 car configuration: ${JSON.stringify(params, null, 2)}. Provide a detailed analysis of its expected performance, including its strengths and weaknesses on different track types. Explain how the parameters interact. For the textual analysis, use markdown-like formatting with **Bold Headings** and bullet points starting with '- '.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisResultSchema,
      },
    });

    const jsonText = response.text.trim();
    // Basic check for JSON structure
    if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
        throw new Error("Invalid JSON response from API. The model may have failed to follow instructions.");
    }

    const result: AnalysisResult = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error("Error analyzing car performance:", error);
    throw new Error("Failed to get analysis from AI. Please check the console for more details.");
  }
};

export const getF1Annotations = async (params: CarParameters): Promise<Annotation[]> => {
    const model = "gemini-2.5-pro";
    const systemInstruction = "You are an F1 technical analyst. Your task is to identify the car components most affected by a given set of parameters and provide a brief technical summary for each. You must only return JSON.";
    const prompt = `
        Based on the F1 car parameters below, identify the 5 most impacted components.
        For each, provide a 'partName' and a brief, one-sentence 'description' of the impact.
        
        **CRUCIAL**: Only use 'partName' values from this exact list: 
        ['Front Wing', 'Rear Wing', 'Underbody / Floor', 'Sidepods', 'Power Unit', 'Chassis / Weight']

        Parameters:
        ${JSON.stringify(params, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: annotationsSchema,
            },
        });
        const jsonText = response.text.trim();
        const result: Annotation[] = JSON.parse(jsonText);
        return result;
    } catch (error) {
        console.error("Error generating F1 annotations:", error);
        throw new Error("Failed to generate annotations from AI.");
    }
};


export const generateAeroFlowImage = async (params: CarParameters): Promise<string> => {
    const model = 'gemini-2.5-flash-image';
    const prompt = `
      **Technical Directive: High-Fidelity CFD Aerodynamic Visualization**

      **1. CORE MANDATE**
         - **Output**: A single, ultra-high-detail, scientifically-plausible PNG image that mimics a professional Computational Fluid Dynamics (CFD) simulation.
         - **CRUCIAL**: The background MUST be 100% transparent.
         - **CRUCIAL**: DO NOT render the car itself. Instead, render a very subtle, dark-grey, semi-transparent 'occlusion shadow' where the car body would be. This provides context for the airflow interacting with a solid object without drawing the car. The silhouette must be of a 2026-spec F1 car, facing left.

      **2. VISUAL STYLE: "CFD SCIENTIFIC VISUALIZATION"**
         - **Flow Representation**: Render the airflow as dense, thin, and precise streamlines or ribbons. Avoid overly artistic 'glow' or 'bloom' effects. The visualization must look like scientific data, not an energy field.
         - **Color Mapping**: Use a standard 'Jet' (or 'Rainbow') colormap to represent air pressure. The gradient MUST be smooth.
            - **VERY HIGH PRESSURE**: Deep Red (e.g., front wing stagnation point).
            - **MODERATE PRESSURE**: Orange / Yellow.
            - **AMBIENT/NEUTRAL PRESSURE**: Green.
            - **LOW PRESSURE**: Cyan.
            - **VERY LOW PRESSURE (HIGH VELOCITY)**: Deep, vibrant Blue (e.g., underbody Venturi tunnels).

      **3. PARAMETER-DRIVEN AERODYNAMIC PHENOMENA (Current: Downforce=${params.aeroDownforce}, Drag=${params.aeroDrag})**

         **3.1. GROUND EFFECT (TIED TO DOWNFORCE):**
            - This is the most critical feature. Clearly resolve the high-velocity, low-pressure stream (deep blue) being sucked into the large Venturi tunnel inlets and accelerating dramatically under the car.
            - The intensity of the blue and the velocity of the streamlines under the car MUST be directly proportional to the **Downforce (${params.aeroDownforce}/100)** setting.

         **3.2. WAKE & VORTICES (TIED TO DRAG):**
            - The **Drag (${params.aeroDrag}/100)** parameter dictates the wake's character.
            - **High Drag**: A large, chaotic, turbulent wake ("dirty air"). This MUST feature clearly-defined vortical structures, visualized as helical/swirling streamlines trailing from the rear wing tips and rear wheel areas. The wake should be wide and messy.
            - **Low Drag**: A much narrower, cleaner, and more organized wake with minimal visible vortices and turbulence. The streamlines should be more parallel and less chaotic.

         **3.3. OUTWASH & WING ELEMENTS:**
            - Show a significant portion of the airflow from the front wing being directed outwards ("outwash") around the front wheels.
            - Show smaller, coherent vortical structures peeling off the tips of the front and rear wing elements.

      **4. FINAL CHECK:** The image must be a visually impressive and aerodynamically insightful CFD-style representation of airflow around an F1 car, on a transparent background, accurately reflecting the specified parameters, pressure zones, and key aerodynamic phenomena like ground effect and wake turbulence.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image data was generated.");
    } catch (error) {
        console.error("Error generating aero flow image:", error);
        throw new Error("Failed to generate aerodynamic visualization.");
    }
};

export const getF1ComponentSpecs = async (partName: string, params: CarParameters): Promise<string> => {
  const model = "gemini-2.5-pro";
  const systemInstruction = `You are an expert F1 technical analyst. Your task is to provide a detailed technical specification and explanation for a specific F1 car component, considering the provided overall car parameters. The explanation should be accessible but technically rich. Use markdown formatting with '##' for subheadings and '-' for list items.`;
  const prompt = `
    Provide a detailed technical deep-dive for the following F1 component: **${partName}**.

    The component is part of a 2026-spec car with the following overall configuration:
    ${JSON.stringify(params, null, 2)}

    Your analysis should cover:
    1.  **Primary Function**: What is its main role on the car?
    2.  **2026 Regulation Impact**: How do the 2026 regulations specifically affect the design and function of this part?
    3.  **Interaction with Car Parameters**: Explain how this component's performance is influenced by or influences the provided car parameters (e.g., how does the front wing design relate to aero downforce and drag?).
    4.  **Design Considerations**: What are the key materials, design trade-offs, and manufacturing complexities for this component?

    Format the response clearly using markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error(`Error generating specs for ${partName}:`, error);
    throw new Error(`Failed to get technical specs for ${partName} from AI.`);
  }
};