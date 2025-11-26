import { CarParameters, AnalysisResult, Track, SensitivityDataPoint } from '../types';

// Get the API base URL - in production this will be the Vercel deployment URL
const getApiBaseUrl = () => {
  // In development, use the local Vite dev server proxy or Vercel dev
  if (import.meta.env.DEV) {
    return '';  // Use relative URLs, Vite will proxy to localhost
  }
  // In production, use relative URLs (same domain as the deployed app)
  return '';
};

export const analyzeCarPerformance = async (params: CarParameters, track: Track): Promise<AnalysisResult> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params, track }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as AnalysisResult;
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
    const response = await fetch(`${getApiBaseUrl()}/api/sensitivity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ baseParams, track, variable, min, max, steps }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results as SensitivityDataPoint[];
  } catch (error) {
    console.error("Sensitivity Analysis Error:", error);
    throw error;
  }
};

export const generateAeroFlowImage = async (params: CarParameters, track: Track): Promise<string> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params, track }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Image generation failed:', errorData.error);
      return ''; // Return empty string on error
    }

    const data = await response.json();
    return data.imageData || '';
  } catch (error) {
    console.error("Image Gen Error:", error);
    return ''; 
  }
};