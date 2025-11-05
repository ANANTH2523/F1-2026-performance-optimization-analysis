export interface CarParameters {
  aeroDownforce: number; // 20-100 scale
  aeroDrag: number; // 20-100 scale (inversely related to downforce)
  suspensionStiffness: number; // 20-100 scale
  tyreCompound: number; // 1 (soft) to 5 (hard)
  enginePowerICE: number; // 500-550 kW
  enginePowerMGU: number; // 300-350 kW
  batteryEnergyDeployment: number; // 50-100%
  chassisWeightKg: number; // 720-760 kg
}

export interface PerformanceMetrics {
  topSpeedKmh: number;
  brakingEfficiency: number; // 0-100 scale
  maxCorneringG: number;
  lowSpeedGrip: number; // 0-100 scale
  tractionScore: number; // 0-100 scale
  tyreWearIndex: number; // 1-10 scale (lower is better wear)
  energyRecoveryEfficiency: number; // 0-100 scale
  lapTimePotential: number; // 1-10 scale (lower is better time)
  chassisResponsiveness: number; // 0-100 scale
  highSpeedStability: number; // 0-100 scale
}

export interface AnalysisResult {
  metrics: PerformanceMetrics;
  analysis: string;
}
