import { CarParameters, AnalysisResult, Track, SensitivityDataPoint, PerformanceMetrics } from '../types';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const baseLapTimes: Record<string, number> = {
  'bahrain': 89.1, 'jeddah': 87.4, 'albert-park': 75.9, 'suzuka': 88.2, 'shanghai': 93.6,
  'miami': 87.2, 'imola': 74.7, 'monaco': 71.3, 'montreal': 72.0, 'catalunya': 71.4,
  'spielberg': 64.3, 'silverstone': 85.8, 'hungaroring': 75.2, 'spa': 104.2, 'zandvoort': 70.5,
  'monza': 80.2, 'baku': 100.2, 'singapore': 90.9, 'cota': 94.2, 'mexico': 77.1,
  'interlagos': 70.1, 'las-vegas': 92.7, 'lusail': 83.7, 'abu-dhabi': 83.4
};

export const calculateMetrics = (params: CarParameters, track: Track): PerformanceMetrics => {
  const downforceInput = params.aeroDownforce / 100; 
  const dragInput = params.aeroDrag / 100; 
  const powerNorm = ((params.enginePowerICE + params.enginePowerMGU) - 700) / 400; 
  const weightNorm = (params.chassisWeightKg - 700) / 40; 
  const tyreGripNorm = (6 - params.tyreCompound) / 5; 
  const heaveStiffnessNorm = params.suspensionStiffness / 100;

  // AERODYNAMIC STALL MODEL (Hardcore Parabolic Physics)
  // Pushing downforce too high causes boundary layer separation (stall)
  let effectiveDownforce = downforceInput;
  let stallDragPenalty = 0;
  const stallThreshold = 0.88 + (heaveStiffnessNorm * 0.05); // Stiffer suspension delays stall due to stable ride height

  if (downforceInput > stallThreshold) {
      // Massive downforce drop-off (diffuser/wing stall)
      const stallSeverity = downforceInput - stallThreshold;
      effectiveDownforce = stallThreshold - Math.pow(stallSeverity, 2) * 8;
      // Flow separation causes immense parasitic drag spike
      stallDragPenalty = Math.pow(stallSeverity, 1.5) * 60; 
  }

  // 1. Top Speed (km/h)
  const powerAdvantage = powerNorm * 35;
  const standardDrag = Math.pow(dragInput + (params.frontWingFlapAngle / 60), 1.5) * 25; 
  let topSpeed = 325 + powerAdvantage - standardDrag - stallDragPenalty;

  if (track.downforceLevel === 'low') topSpeed += 12;
  if (track.downforceLevel === 'max') topSpeed -= 8;
  topSpeed = clamp(topSpeed, 280, 365);

  // 2. Cornering G-Force
  const aeroGrip = Math.pow(effectiveDownforce, 0.8) * 1.9; 
  const mechanicalGrip = tyreGripNorm * 0.8;
  const weightPenaltyG = weightNorm * 0.3;
  const maxCorneringG = clamp(3.5 + aeroGrip + mechanicalGrip - weightPenaltyG, 3.0, 6.5);

  // 3. Braking Efficiency
  const brakingEfficiency = clamp(60 + effectiveDownforce * 25 + tyreGripNorm * 15 - weightNorm * 10, 0, 100);

  // 4. Low Speed Grip (Mechanical)
  // Too stiff = bouncing/loss of contact patch at low speeds
  const suspensionSweetSpot = 1 - Math.pow(Math.abs(heaveStiffnessNorm - 0.4), 2) * 2; 
  const lowSpeedGrip = clamp(50 + tyreGripNorm * 35 + suspensionSweetSpot * 20, 0, 100);

  // 5. Traction Score
  const tractionScore = clamp(50 + tyreGripNorm * 30 + effectiveDownforce * 15 + (params.batteryEnergyDeployment / 100) * 5, 0, 100);

  // 6. Tyre Wear Index
  let wearBase = params.tyreCompound * 1.6; 
  if (track.abrasiveness === 'high') wearBase *= 1.4;
  if (track.abrasiveness === 'low') wearBase *= 0.8;
  const slidingPenalty = Math.pow((1 - effectiveDownforce), 2) * 2.5; 
  const stiffnessPenalty = Math.pow(heaveStiffnessNorm, 2) * 1.5; // Stiff car shreds surface rubber
  const tyreWearIndex = clamp(wearBase + weightNorm * 1.0 + slidingPenalty + stiffnessPenalty, 1, 10);

  // 7. Energy Recovery Efficiency
  const energyRecoveryEfficiency = clamp(60 + (params.enginePowerMGU - 300) / 1.5 + (params.batteryEnergyDeployment - 50) * 0.2, 0, 100);

  // 8. Chassis Responsiveness (Yaw Phase)
  const chassisResponsiveness = clamp(70 + heaveStiffnessNorm * 25 - weightNorm * 25, 0, 100);

  // 9. High Speed Stability (CoP Migration)
  const highSpeedStability = clamp(40 + effectiveDownforce * 55 + (1 - Math.abs(heaveStiffnessNorm - 0.7)) * 15, 0, 100);

  // 10. Lap Time Calculation
  const baseTime = baseLapTimes[track.id] || 90.0;
  
  let idealDownforce = 0.5;
  let idealDrag = 0.5;
  let idealStiffness = 0.5;
  
  if (track.downforceLevel === 'max') { idealDownforce = 0.95; idealDrag = 0.7; idealStiffness = 0.4; }
  else if (track.downforceLevel === 'high') { idealDownforce = 0.8; idealDrag = 0.6; idealStiffness = 0.5; }
  else if (track.downforceLevel === 'low') { idealDownforce = 0.3; idealDrag = 0.2; idealStiffness = 0.8; }
  else { idealDownforce = 0.6; idealDrag = 0.5; idealStiffness = 0.6; }

  let lapTimeDelta = 0;
  
  // Parabolic deltas
  const dfDeviation = Math.pow(effectiveDownforce - idealDownforce, 2);
  const dragDeviation = Math.pow(dragInput - idealDrag, 2);
  const stiffDeviation = Math.pow(heaveStiffnessNorm - idealStiffness, 2);
  
  lapTimeDelta += dfDeviation * 3.5; 
  lapTimeDelta += dragDeviation * 2.0;
  lapTimeDelta += stiffDeviation * 1.2;
  lapTimeDelta += weightNorm * 1.0; 
  lapTimeDelta -= tyreGripNorm * 1.5; 
  lapTimeDelta -= powerNorm * 0.8; 
  
  // Catastrophic stall penalty
  if (stallDragPenalty > 0) lapTimeDelta += stallDragPenalty * 0.1;

  lapTimeDelta += 1.0;

  const finalLapTimeSeconds = baseTime + lapTimeDelta;
  
  const minutes = Math.floor(finalLapTimeSeconds / 60);
  const seconds = Math.floor(finalLapTimeSeconds % 60);
  const milliseconds = Math.floor((finalLapTimeSeconds % 1) * 1000);
  const simulatedLapTime = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;

  const lapTimePotential = clamp(1 + (lapTimeDelta * 3.0), 1, 10);

  return {
    topSpeedKmh: Math.round(topSpeed * 10) / 10,
    brakingEfficiency: Math.round(brakingEfficiency),
    maxCorneringG: Math.round(maxCorneringG * 100) / 100,
    lowSpeedGrip: Math.round(lowSpeedGrip),
    tractionScore: Math.round(tractionScore),
    tyreWearIndex: Math.round(tyreWearIndex * 10) / 10,
    energyRecoveryEfficiency: Math.round(energyRecoveryEfficiency),
    lapTimePotential: Math.round(lapTimePotential * 10) / 10,
    chassisResponsiveness: Math.round(chassisResponsiveness),
    highSpeedStability: Math.round(highSpeedStability),
    simulatedLapTime
  };
};

export const generateAnalysisText = (params: CarParameters, track: Track, metrics: PerformanceMetrics): string => {
  const downforceInput = params.aeroDownforce / 100;
  const dragInput = params.aeroDrag / 100;
  const heaveStiffnessNorm = params.suspensionStiffness / 100;
  const stallThreshold = 0.88 + (heaveStiffnessNorm * 0.05);
  const isStalled = downforceInput > stallThreshold;
  
  // Calculate fake telemetry data for tables
  const frontWingLoad = Math.round(params.aeroDownforce * 0.43 * 10) / 10;
  const rearWingLoad = Math.round(params.aeroDownforce * 0.57 * 10) / 10;
  const copMigration = Math.round(heaveStiffnessNorm * 4.2 * 10) / 10;
  const throatPressure = isStalled ? -0.1 : - (1.1 + downforceInput * 0.8);
  const expansionRatio = isStalled ? 14 : Math.round(85 + downforceInput * 10);
  const thermalIndex = Math.round(metrics.tyreWearIndex * 15 + 85);
  const dragPenalty = isStalled ? 'CATASTROPHIC' : `${Math.round(dragInput * 45)} kg`;

  let analysis = `# 📡 PRINCIPAL TELEMETRY & STRATEGY DOSSIER: ${track.name.toUpperCase()}\n\n`;
  
  analysis += `> **SIMULATED QUALIFYING DELTA:** \`${metrics.simulatedLapTime}\`\n`;
  analysis += `> **OPERATIONAL WINDOW:** \`${track.downforceLevel.toUpperCase()} DOWNFORCE\` | \`${track.abrasiveness.toUpperCase()} DEGRADATION\`\n\n`;

  // --- SECTION 1: KINEMATIC PHASE BREAKDOWN ---
  analysis += `## 1. DYNAMIC PHASE ASSESSMENT\n\n`;
  
  // Turn-In Phase
  analysis += `### [Phase 1] Corner Entry & Turn-In\n`;
  if (params.chassisWeightKg > 730) {
    analysis += `The front axle is suffering from immense longitudinal inertia due to a ${params.chassisWeightKg}kg total mass. Trail braking stability is compromised, and the measured yaw rate is trailing steering input by 120ms. The driver is fighting severe entry understeer.\n`;
  } else if (metrics.brakingEfficiency > 80) {
    analysis += `Exceptional front-end bite. Center of Pressure (CoP) migration is actively supporting the front axle under heavy 5G deceleration. Turn-in yaw rate hits target delta instantly, allowing the driver to carry immense minimum speed to the apex.\n`;
  } else {
    analysis += `Nominal entry response. Anti-dive geometry is maintaining an acceptable aerodynamic platform, though minor micro-locking is occurring on the unloaded inside wheel during heavy trail braking.\n`;
  }

  // Apex Phase
  analysis += `\n### [Phase 2] Apex & Mid-Corner Floor Sealing\n`;
  if (isStalled) {
    analysis += `**CRITICAL AERODYNAMIC FAILURE.** The underfloor diffuser has completely stalled. The boundary layer is fully detached from the floor strakes. The car is violently porpoising at 6.5Hz as suction is repeatedly lost and regained. Lateral grip is non-existent.\n`;
  } else if (metrics.maxCorneringG >= 5.5) {
    analysis += `The floor is perfectly sealed. Venturi tunnels are generating maximum ground effect vacuum, holding the chassis to the track with a stable ${metrics.maxCorneringG}G lateral load. High-speed direction changes are violently fast.\n`;
  } else if (params.suspensionStiffness > 80 && track.type.includes('Street')) {
    analysis += `Contact patch fluctuation detected. The heave spring stiffness (${params.suspensionStiffness}kN/m) is too rigid for this street circuit, causing the floor to leak suction when striking apex kerbs.\n`;
  } else {
    analysis += `The aerodynamic platform is stable, but not maximizing the downforce map. We are leaving significant lateral grip on the table. The floor throat pressure is not reaching target vacuum levels.\n`;
  }

  // Exit Phase
  analysis += `\n### [Phase 3] Corner Exit Traction\n`;
  if (metrics.tractionScore > 80) {
    analysis += `Superior combined longitudinal and lateral grip. The ERS deployment profile (MGU-K) is perfectly mapped to the tyre slip angles, allowing the driver to achieve 100% throttle application 15 meters earlier than the baseline delta.\n`;
  } else if (metrics.tyreWearIndex > 7.5) {
    analysis += `Severe thermal degradation detected on corner exit. Rear surface temperatures are spiking above 135°C. Excessive wheelspin is actively shredding the C${params.tyreCompound} carcass.\n`;
  } else {
    analysis += `Adequate traction phase. The MGU-K mapping could be tuned more aggressively to exploit the available rear mechanical grip, but current settings are safe for tyre preservation.\n`;
  }

  // --- SECTION 2: HARD DATA TELEMETRY METRICS ---
  analysis += `\n## 2. HARD TELEMETRY LOGS\n\n`;
  
  analysis += `| Sensor Group | Metric | Live Value | Target Delta | Status |\n`;
  analysis += `| :--- | :--- | :--- | :--- | :--- |\n`;
  analysis += `| **Aerodynamics** | Front Axle Aero Load | **${frontWingLoad}%** | 42.0% | ${frontWingLoad > 45 ? '🔴 Too High' : '🟢 Optimal'} |\n`;
  analysis += `| **Aerodynamics** | Rear Axle Aero Load | **${rearWingLoad}%** | 58.0% | ${rearWingLoad < 50 ? '🔴 Too Low' : '🟢 Optimal'} |\n`;
  analysis += `| **Aerodynamics** | Floor Throat Vacuum | **${throatPressure.toFixed(2)} bar** | -1.5 bar | ${isStalled ? '🔴 STALLED' : '🟢 Sealed'} |\n`;
  analysis += `| **Aerodynamics** | Diffuser Expansion Ratio | **${expansionRatio}%** | > 80% | ${expansionRatio < 50 ? '🔴 SEPARATED' : '🟢 Attached'} |\n`;
  analysis += `| **Kinematics** | CoP Forward Migration | **${copMigration}%** | < 3.0% | ${copMigration > 3.5 ? '🟡 Snappy' : '🟢 Stable'} |\n`;
  analysis += `| **Kinematics** | Heave Spring Rate | **${params.suspensionStiffness} kN/m** | Track Dep. | ${params.suspensionStiffness > 80 && track.type.includes('Street') ? '🔴 Too Stiff' : '🟢 Nominal'} |\n`;
  analysis += `| **Powertrain** | Parasitic Drag Penalty | **${dragPenalty}** | < 25 kg | ${isStalled ? '🔴 CATASTROPHIC' : (dragInput > 0.6 ? '🟡 High' : '🟢 Low')} |\n`;
  analysis += `| **Thermal** | Rear Axle Peak Temp | **${thermalIndex}°C** | 105°C | ${thermalIndex > 120 ? '🔴 OVERHEATING' : '🟢 Optimal'} |\n`;

  // --- SECTION 3: STRATEGIC RACE OUTCOMES ---
  analysis += `\n## 3. WEEKEND PROJECTIONS\n\n`;

  if (isStalled) {
    analysis += `> 🚨 **CATASTROPHIC PREDICTION:** The car is undriveable. The aerodynamic stall will result in a Q1 elimination and potential loss of control through high-speed sectors. **Immediate garage teardown required.**\n`;
  } else if (metrics.lapTimePotential <= 2.5) {
    analysis += `> 🏆 **POLE POSITION PREDICTION:** This setup is perfectly correlated to the simulation matrix. You will dominate the speed traps and carry immense minimum speed through the apex. **Expected Outcome: Front Row Lockout & Race Win.**\n`;
  } else if (metrics.lapTimePotential <= 5.5) {
    analysis += `> ⚠️ **MIDFIELD PREDICTION:** We are trapped in the aerodynamic midfield. The setup is safe but lacks the aggressive edge required for overtaking. Tyre degradation is manageable, opening up a potential 1-stop overcut strategy. **Expected Outcome: P5 - P8.**\n`;
  } else {
    analysis += `> ❌ **BACKMARKER PREDICTION:** The L/D (Lift-to-Drag) ratio is completely mismatched for ${track.name}. We are hemorrhaging lap time on the straights and destroying the tyres in the corners. **Expected Outcome: P15 or lower.**\n`;
  }

  // --- SECTION 4: IMMEDIATE ENGINEERING DIRECTIVES ---
  analysis += `\n## 4. ENGINEERING DIRECTIVES (ACTION REQUIRED)\n\n`;
  
  if (isStalled) {
    analysis += `- 🔴 **AERODYNAMICS**: YOU HAVE STALLED THE FLOOR. Reduce Downforce Index to **< ${Math.floor(stallThreshold * 100)}** immediately to re-attach the boundary layer.\n`;
  } else if (track.downforceLevel === 'max' && downforceInput < 0.8) {
    analysis += `- 🟡 **AERODYNAMICS**: Increase Downforce Index to **85-95**. We need maximum suction for this layout. Drag penalty is irrelevant here.\n`;
  } else if (track.downforceLevel === 'low' && dragInput > 0.4) {
    analysis += `- 🟡 **AERODYNAMICS**: Strip the rear wing. Drop Drag Coefficient to **20-35**. We are hemorrhaging time on the straights and will be sitting ducks in DRS zones.\n`;
  }

  if (track.abrasiveness === 'high' && params.tyreCompound >= 4) {
    analysis += `- 🔴 **TYRES**: Abandon the C${params.tyreCompound} softs. The macro-roughness is triggering thermal blistering. Bolt on the Hard compound (C1/C2) for the race stint.\n`;
  } else if (track.abrasiveness === 'low' && params.tyreCompound <= 2) {
    analysis += `- 🔴 **TYRES**: The surface is too smooth for C${params.tyreCompound} hards. We cannot generate core temperature. Switch to C4/C5 softs to exploit chemical grip.\n`;
  }

  if (track.type.includes('Street') && params.suspensionStiffness > 50) {
    analysis += `- 🟡 **SUSPENSION**: Soften heave stiffness to **30-45**. Stop the car from bouncing over the street bumps. Let the suspension breathe to maintain the contact patch.\n`;
  } else if (track.type === 'Permanent Circuit' && params.suspensionStiffness < 50) {
    analysis += `- 🟡 **SUSPENSION**: Stiffen the chassis to **60-80**. Lock the aero platform in place to survive high-speed aerodynamic loads without bottoming out.\n`;
  }

  if (params.chassisWeightKg > 710) {
    analysis += `- 🔴 **MASS**: The car is ${params.chassisWeightKg - 710}kg overweight. Remove the ballast. It's destroying our braking performance and longitudinal acceleration.\n`;
  }

  if (!isStalled && track.downforceLevel !== 'max' && track.downforceLevel !== 'low' && downforceInput >= 0.8 && dragInput <= 0.4 && params.chassisWeightKg <= 710) {
       analysis += `- 🟢 **ALL SYSTEMS GREEN**: Lock in parc fermé settings. Do not touch the car.\n`;
  }

  analysis += `\n--- *End of Dossier. Align parameters and rerun simulation matrix.* ---`;

  return analysis;
};

export const analyzeCarPerformance = async (params: CarParameters, track: Track): Promise<AnalysisResult> => {
  await new Promise(resolve => setTimeout(resolve, 300)); 
  const metrics = calculateMetrics(params, track);
  const analysis = generateAnalysisText(params, track, metrics);
  return { metrics, analysis };
};

export const performSensitivityAnalysis = async (
  baseParams: CarParameters,
  track: Track,
  variable: keyof CarParameters,
  min: number,
  max: number,
  steps: number
): Promise<SensitivityDataPoint[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const results: SensitivityDataPoint[] = [];
  const stepSize = (max - min) / Math.max(1, (steps - 1));

  for (let i = 0; i < steps; i++) {
    const val = min + (i * stepSize);
    const testParams = { ...baseParams, [variable]: val };
    const metrics = calculateMetrics(testParams, track);
    
    results.push({
      paramValue: Math.round(val * 10) / 10,
      metrics
    });
  }

  return results;
};
