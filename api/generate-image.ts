import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
        const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return res.status(200).json({ imageData });
      }
    }
    
    return res.status(500).json({ error: 'No image data received' });

  } catch (error) {
    console.error('Image Generation Error:', error);
    return res.status(500).json({ 
      error: 'Image generation failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
