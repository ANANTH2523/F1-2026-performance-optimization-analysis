import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { CarParameters, PerformanceMetrics } from '../types';
import { analyzeCarPerformance } from '../services/geminiService';

interface SensitivityChartProps {
  currentParams: CarParameters;
}

type AnalyzableParam = 'aeroDownforce' | 'aeroDrag' | 'suspensionStiffness' | 'batteryEnergyDeployment' | 'chassisWeightKg';
type PlottableMetric = keyof PerformanceMetrics;

interface SensitivityDataPoint {
  paramValue: number;
  metrics: PerformanceMetrics;
}

const PARAM_CONFIG: Record<AnalyzableParam, { name: string, min: number, max: number, unit: string }> = {
  aeroDownforce: { name: 'Aero Downforce', min: 20, max: 100, unit: '' },
  aeroDrag: { name: 'Aero Drag', min: 20, max: 100, unit: '' },
  suspensionStiffness: { name: 'Suspension Stiffness', min: 20, max: 100, unit: '' },
  batteryEnergyDeployment: { name: 'Battery Deployment', min: 50, max: 100, unit: '%' },
  chassisWeightKg: { name: 'Chassis Weight', min: 700, max: 740, unit: 'kg' },
};

// Fix: Add missing metrics to METRIC_CONFIG to satisfy the Record type.
const METRIC_CONFIG: Record<PlottableMetric, { name: string, higherIsBetter: boolean }> = {
    lapTimePotential: { name: 'Lap Potential', higherIsBetter: false },
    topSpeedKmh: { name: 'Top Speed (km/h)', higherIsBetter: true },
    maxCorneringG: { name: 'Max Cornering G', higherIsBetter: true },
    tyreWearIndex: { name: 'Tyre Wear Index', higherIsBetter: false },
    brakingEfficiency: { name: 'Braking Efficiency', higherIsBetter: true },
    lowSpeedGrip: { name: 'Low Speed Grip', higherIsBetter: true },
    energyRecoveryEfficiency: { name: 'Energy Recovery', higherIsBetter: true },
    tractionScore: { name: 'Traction Score', higherIsBetter: true },
};


const SensitivityChart: React.FC<SensitivityChartProps> = ({ currentParams }) => {
  const [selectedParam, setSelectedParam] = useState<AnalyzableParam>('aeroDownforce');
  const [data, setData] = useState<SensitivityDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeSensitivity = async () => {
    setIsLoading(true);
    setError(null);
    setData(null);

    const config = PARAM_CONFIG[selectedParam];
    const steps = 5;
    const range = config.max - config.min;
    const stepValue = range / (steps - 1);
    const paramValues = Array.from({ length: steps }, (_, i) => Math.round(config.min + i * stepValue));

    try {
      const promises = paramValues.map(value => {
        const newParams = { ...currentParams, [selectedParam]: value };
        return analyzeCarPerformance(newParams);
      });

      const results = await Promise.all(promises);
      
      const chartData = results.map((result, index) => ({
        paramValue: paramValues[index],
        metrics: result.metrics,
      }));
      setData(chartData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run sensitivity analysis.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(d => ({
        paramValue: d.paramValue,
        ...d.metrics,
    }));
  }, [data]);
  

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
        Parameter Sensitivity Analysis
      </h2>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="flex-grow w-full md:w-auto">
            <label htmlFor="param-select" className="block text-sm font-medium text-gray-300 mb-1">Analyze Parameter:</label>
            <select
            id="param-select"
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value as AnalyzableParam)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            {Object.entries(PARAM_CONFIG).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
            ))}
            </select>
        </div>
        <button
          onClick={handleAnalyzeSensitivity}
          disabled={isLoading}
          className="w-full md:w-auto py-2 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors mt-2 md:mt-6"
        >
          {isLoading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      
      <div className="h-96 w-full mt-4">
        {!isLoading && !data && (
             <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p>Run an analysis to see how changing a parameter affects performance.</p>
            </div>
        )}
        {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                 <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
                 <p className="mt-4">Running AI simulations...</p>
            </div>
        )}
        {data && (
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis dataKey="paramValue" stroke="#9ca3af" domain={['dataMin', 'dataMax']}>
                <Label value={`${PARAM_CONFIG[selectedParam].name} (${PARAM_CONFIG[selectedParam].unit})`} offset={-15} position="insideBottom" fill="#d1d5db" />
              </XAxis>
              <YAxis yAxisId="left" stroke="#9ca3af">
                 <Label value="Metric Value" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#d1d5db' }} />
              </YAxis>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  borderColor: '#4b5563',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                formatter={(value: number, name: string) => [value.toFixed(2), name]}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              {Object.entries(METRIC_CONFIG).map(([key, {name}], index) => (
                <Line 
                    key={key}
                    yAxisId="left" 
                    type="monotone" 
                    dataKey={key} 
                    name={name}
                    stroke={['#3b82f6', '#84cc16', '#ef4444', '#f97316', '#eab308', '#a855f7'][index % 6]} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SensitivityChart;