import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { PerformanceMetrics } from '../types';

interface PerformanceChartProps {
  metrics: PerformanceMetrics | null;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ metrics }) => {
  // Normalize data for the chart. Radar charts work best with values on a similar scale (e.g., 0-100).
  // We also invert values where lower is better (lap time, tyre wear).
  const processDataForChart = (m: PerformanceMetrics) => {
    const data = [
      { subject: 'Top Speed', value: ((m.topSpeedKmh - 320) / (370 - 320)) * 100, fullMark: 100, unit: 'km/h', original: m.topSpeedKmh },
      { subject: 'Braking', value: m.brakingEfficiency, fullMark: 100, unit: '/100', original: m.brakingEfficiency },
      { subject: 'Cornering', value: ((m.maxCorneringG - 4.5) / (6.0 - 4.5)) * 100, fullMark: 100, unit: 'G', original: m.maxCorneringG },
      { subject: 'Low-Speed Grip', value: m.lowSpeedGrip, fullMark: 100, unit: '/100', original: m.lowSpeedGrip },
      { subject: 'Traction', value: m.tractionScore, fullMark: 100, unit: '/100', original: m.tractionScore },
      { subject: 'Tyre Life', value: 100 - (m.tyreWearIndex - 1), fullMark: 100, unit: '/100', original: m.tyreWearIndex }, // Inverted
      { subject: 'Energy Recov.', value: m.energyRecoveryEfficiency, fullMark: 100, unit: '/100', original: m.energyRecoveryEfficiency },
      { subject: 'Lap Potential', value: 100 - (m.lapTimePotential - 1), fullMark: 100, unit: '/100', original: m.lapTimePotential }, // Inverted
    ];
    // Cap values at 100 to prevent chart distortion
    return data.map(d => ({ ...d, value: Math.min(100, Math.max(0, d.value)) }));
  };

  const chartData = metrics ? processDataForChart(metrics) : [];

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 h-96">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
        Performance Profile
      </h2>
      {metrics ? (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#4b5563" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#d1d5db', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                borderColor: '#4b5563',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#ffffff' }}
              formatter={(value, name, props) => [`${props.payload.original.toFixed(2)} ${props.payload.unit}`, "Value"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p className="text-lg">Performance chart will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;