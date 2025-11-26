
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { CarParameters, SensitivityDataPoint } from '../types';
import { performSensitivityAnalysis } from '../services/geminiService';
import { tracks } from '../data/tracks';

interface SensitivityChartProps {
  currentParams: CarParameters;
  selectedTrackId: string;
}

type AnalyzableParam = 'aeroDownforce' | 'aeroDrag' | 'suspensionStiffness' | 'batteryEnergyDeployment' | 'chassisWeightKg';

const PARAM_CONFIG: Record<AnalyzableParam, { name: string, min: number, max: number, unit: string }> = {
  aeroDownforce: { name: 'Aero Downforce', min: 20, max: 100, unit: '' },
  aeroDrag: { name: 'Aero Drag', min: 20, max: 100, unit: '' },
  suspensionStiffness: { name: 'Suspension Stiffness', min: 20, max: 100, unit: '' },
  batteryEnergyDeployment: { name: 'Battery Deployment', min: 50, max: 100, unit: '%' },
  chassisWeightKg: { name: 'Chassis Weight', min: 700, max: 740, unit: 'kg' },
};

const SensitivityChart: React.FC<SensitivityChartProps> = ({ currentParams, selectedTrackId }) => {
  const [selectedParam, setSelectedParam] = useState<AnalyzableParam>('aeroDownforce');
  const [data, setData] = useState<SensitivityDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeSensitivity = async () => {
    setIsLoading(true);
    setError(null);
    setData(null);

    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) {
      setError("Selected track not found.");
      setIsLoading(false);
      return;
    }

    const config = PARAM_CONFIG[selectedParam];
    const steps = 5;

    try {
      // Use the batch analysis function instead of a loop
      const results = await performSensitivityAnalysis(
        currentParams,
        track,
        selectedParam,
        config.min,
        config.max,
        steps
      );

      setData(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run sensitivity analysis.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formattedChartData = useMemo(() => {
    if (!data) return [];
    return data.map(d => ({
        paramValue: d.paramValue,
        topSpeedKmh: d.metrics.topSpeedKmh,
        maxCorneringG: d.metrics.maxCorneringG,
        lapTimePotential: d.metrics.lapTimePotential,
        tyreWearIndex: d.metrics.tyreWearIndex,
    }));
  }, [data]);

  const ChartDisplay = useMemo(() => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-blue-400/50">
                 <div className="w-8 h-8 border-2 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                 <span className="text-xs uppercase tracking-widest animate-pulse">Computing Physics Model...</span>
            </div>
        );
    }
    
    if (!data || data.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <div className="text-4xl mb-2 opacity-50">⚡</div>
                <p className="text-xs uppercase tracking-widest">Select Variable & Run Sweep</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          
          <XAxis 
            dataKey="paramValue" 
            stroke="#6b7280" 
            tick={{fontSize: 10}}
            type="number"
            domain={['dataMin', 'dataMax']}
            allowDecimals={false}
          >
            <Label value={`${PARAM_CONFIG[selectedParam].name}`} offset={0} position="insideBottom" fill="#4b5563" fontSize={10} dy={15} />
          </XAxis>
          
          {/* LEFT AXIS: Low values (G-Force, Indices 1-10) */}
          <YAxis 
            yAxisId="left" 
            stroke="#9ca3af" 
            tick={{fontSize: 10}} 
            domain={[0, 12]} 
            label={{ value: 'Index / G-Force', angle: -90, position: 'insideLeft', fill: '#4b5563', fontSize: 9 }}
          />

          {/* RIGHT AXIS: High values (Top Speed ~300) */}
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#3b82f6" 
            tick={{fontSize: 10}} 
            domain={['auto', 'auto']}
            label={{ value: 'Speed (km/h)', angle: 90, position: 'insideRight', fill: '#3b82f6', fontSize: 9 }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              borderRadius: '0.25rem',
              fontSize: '11px'
            }}
            labelStyle={{ color: '#93c5fd', fontWeight: 'bold' }}
            itemStyle={{ padding: 0 }}
            formatter={(value: number) => value.toFixed(2)}
          />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          
          {/* Plotted on Right Axis */}
          <Line yAxisId="right" type="monotone" dataKey="topSpeedKmh" name="Top Speed (km/h)" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
          
          {/* Plotted on Left Axis */}
          <Line yAxisId="left" type="monotone" dataKey="maxCorneringG" name="Cornering G" stroke="#22d3ee" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
          <Line yAxisId="left" type="monotone" dataKey="lapTimePotential" name="Lap Potential (Low=Fast)" stroke="#a855f7" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
          <Line yAxisId="left" type="monotone" dataKey="tyreWearIndex" name="Tyre Wear Index" stroke="#f43f5e" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
          
        </LineChart>
      </ResponsiveContainer>
    );
  }, [data, formattedChartData, isLoading, selectedParam]);
  

  return (
    <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-lg border border-gray-700/50 shadow-lg h-96 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-b border-gray-700 pb-3 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
           <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
           Parameter Sensitivity Sweep
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto mt-2 md:mt-0">
             <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-gray-400 uppercase whitespace-nowrap font-bold">Variable:</span>
                <select
                    value={selectedParam}
                    onChange={(e) => setSelectedParam(e.target.value as AnalyzableParam)}
                    className="bg-gray-900 border border-gray-600 text-gray-200 text-xs uppercase font-mono rounded p-1.5 focus:border-blue-500 outline-none"
                >
                    {Object.entries(PARAM_CONFIG).map(([key, { name }]) => (
                        <option key={key} value={key}>{name}</option>
                    ))}
                </select>
             </div>
             
             <button
                onClick={handleAnalyzeSensitivity}
                disabled={isLoading}
                className="py-1.5 px-4 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded border border-blue-500/50 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
             >
                {isLoading ? 'Processing...' : 'Run Sweep'}
            </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mb-2 bg-red-900/20 p-2 rounded border border-red-500/30">{error}</p>}
      
      <div className="flex-grow w-full min-h-0">
        {ChartDisplay}
      </div>
    </div>
  );
};

export default SensitivityChart;
