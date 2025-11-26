
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PerformanceMetrics } from '../types';

interface PerformanceChartProps {
  metrics: PerformanceMetrics | null;
  baselineMetrics: PerformanceMetrics | null;
}

const PerformanceChart: React.FC<PerformanceChartProps> = React.memo(({ metrics, baselineMetrics }) => {
  
  const normalizeMetrics = (m: PerformanceMetrics) => {
    return {
        topSpeedKmh: ((m.topSpeedKmh - 320) / (370 - 320)) * 100,
        brakingEfficiency: m.brakingEfficiency,
        maxCorneringG: ((m.maxCorneringG - 4.5) / (6.0 - 4.5)) * 100,
        lowSpeedGrip: m.lowSpeedGrip,
        tractionScore: m.tractionScore,
        tyreWearIndex: 100 - (m.tyreWearIndex - 1), 
        energyRecoveryEfficiency: m.energyRecoveryEfficiency,
        lapTimePotential: 100 - (m.lapTimePotential - 1), 
        chassisResponsiveness: m.chassisResponsiveness,
        highSpeedStability: m.highSpeedStability,
    };
  };

  const processDataForChart = () => {
    if (!metrics) return [];

    const current = normalizeMetrics(metrics);
    const baseline = baselineMetrics ? normalizeMetrics(baselineMetrics) : null;

    const subjects = [
      { id: 'topSpeedKmh', name: 'Top Speed', unit: 'km/h', original: metrics.topSpeedKmh, baselineOriginal: baselineMetrics?.topSpeedKmh },
      { id: 'brakingEfficiency', name: 'Braking', unit: '/100', original: metrics.brakingEfficiency, baselineOriginal: baselineMetrics?.brakingEfficiency },
      { id: 'maxCorneringG', name: 'Cornering G', unit: 'G', original: metrics.maxCorneringG, baselineOriginal: baselineMetrics?.maxCorneringG },
      { id: 'lowSpeedGrip', name: 'Mech. Grip', unit: '/100', original: metrics.lowSpeedGrip, baselineOriginal: baselineMetrics?.lowSpeedGrip },
      { id: 'tractionScore', name: 'Traction', unit: '/100', original: metrics.tractionScore, baselineOriginal: baselineMetrics?.tractionScore },
      { id: 'tyreWearIndex', name: 'Tyre Life', unit: '/100', original: metrics.tyreWearIndex, baselineOriginal: baselineMetrics?.tyreWearIndex },
      { id: 'energyRecoveryEfficiency', name: 'ERS Eff.', unit: '/100', original: metrics.energyRecoveryEfficiency, baselineOriginal: baselineMetrics?.energyRecoveryEfficiency },
      { id: 'lapTimePotential', name: 'Pace', unit: '/100', original: metrics.lapTimePotential, baselineOriginal: baselineMetrics?.lapTimePotential },
      { id: 'chassisResponsiveness', name: 'Agility', unit: '/100', original: metrics.chassisResponsiveness, baselineOriginal: baselineMetrics?.chassisResponsiveness },
      { id: 'highSpeedStability', name: 'Stability', unit: '/100', original: metrics.highSpeedStability, baselineOriginal: baselineMetrics?.highSpeedStability },
    ];

    return subjects.map(s => ({
      subject: s.name,
      value: Math.min(100, Math.max(0, current[s.id as keyof typeof current])),
      baseline: baseline ? Math.min(100, Math.max(0, baseline[s.id as keyof typeof baseline])) : undefined,
      fullMark: 100,
      unit: s.unit,
      original: s.original,
      baselineOriginal: s.baselineOriginal
    }));
  };

  const chartData = processDataForChart();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-gray-600 p-3 rounded shadow-xl z-50 backdrop-blur-sm">
          <p className="font-bold text-gray-200 mb-2 uppercase tracking-wide text-xs">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 mb-1 justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }}></div>
                 <span className="text-gray-400 text-xs">{entry.name}</span>
              </div>
              <span className="text-white font-mono text-xs font-bold">
                 {entry.name === 'Current' 
                    ? entry.payload.original.toFixed(2) 
                    : entry.payload.baselineOriginal?.toFixed(2)} 
                 {' '}<span className="text-gray-500 font-normal">{entry.payload.unit}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-md p-4 rounded-lg border border-gray-700/50 h-[400px] w-full relative shadow-lg flex flex-col">
      <h2 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-widest flex justify-between items-center flex-shrink-0">
        <span>Performance Radar</span>
        {baselineMetrics && <span className="text-[10px] bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded border border-amber-900/50">VS BASELINE</span>}
      </h2>
      {metrics ? (
        <div className="flex-grow min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#374151" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                
                {baselineMetrics && (
                <Radar
                    name="Baseline"
                    dataKey="baseline"
                    stroke="#d97706" /* amber-600 */
                    strokeDasharray="4 4"
                    fill="#d97706"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                />
                )}

                <Radar
                name="Current"
                dataKey="value"
                stroke="#22d3ee" /* cyan-400 */
                fill="#0ea5e9" /* sky-500 */
                fillOpacity={0.3}
                strokeWidth={2}
                />

                <Tooltip content={<CustomTooltip />} />
                <Legend 
                    verticalAlign="bottom" 
                    height={20} 
                    iconType="rect"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                />
            </RadarChart>
            </ResponsiveContainer>
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-full text-gray-600">
             <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center mb-2">
                 <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
             </div>
             <span className="text-xs uppercase tracking-widest">No Telemetry Data</span>
         </div>
      )}
    </div>
  );
});

export default PerformanceChart;
