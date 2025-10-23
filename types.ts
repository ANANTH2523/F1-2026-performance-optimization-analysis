// Define the structure for the car's parameters
export interface CarParameters {
  aeroDownforce: number;
  aeroDrag: number;
  powerUnitKW: number;
  mguKPowerKW: number;
  chassisWeightKg: number;
  weightDistribution: number;
  activeAeroMode: 'Z-mode' | 'X-mode';
  suspensionStiffness: number; // New parameter
  batteryEnergyDeployment: number; // New parameter
}

// A named configuration preset
export interface Preset {
  name: string;
  params: CarParameters;
}

// Structured performance metrics estimated by the AI
export interface PerformanceMetrics {
  lapTimePotential: number; // Scale of 1-100, lower is better
  topSpeedKmh: number;
  maxCorneringG: number;
  tyreWearIndex: number; // Scale of 1-100, higher is worse
  brakingEfficiency: number; // Scale of 1-100, higher is better (New)
  lowSpeedGrip: number; // Scale of 1-100, higher is better (New)
  energyRecoveryEfficiency: number; // Scale of 1-100, higher is better
  tractionScore: number; // Scale of 1-100, higher is better
}

// The combined result from the analysis service
export interface AnalysisResult {
  text: string;
  metrics: PerformanceMetrics;
}

// Annotation for a specific part of the car visualization
export interface Annotation {
  partName: string;
  description: string;
}
