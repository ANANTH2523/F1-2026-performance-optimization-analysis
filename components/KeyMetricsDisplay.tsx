import React from 'react';
import { PerformanceMetrics } from '../types';
import { ClockIcon, SpeedometerIcon, ArrowTrendingUpIcon } from './icons/KeyMetricsIcons';

interface KeyMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  description: string;
}

const KeyMetric: React.FC<KeyMetricProps> = ({ icon, label, value, unit, description }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg flex items-center gap-4 relative group cursor-help border border-gray-700">
        <div className="flex-shrink-0 text-blue-500">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-white">
                {value} <span className="text-lg font-medium text-gray-300">{unit}</span>
            </p>
        </div>
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2 text-xs text-center text-gray-200 bg-gray-900 border border-gray-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {description}
             <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-600"></div>
        </div>
    </div>
);


const KeyMetricsDisplay: React.FC<{ metrics: PerformanceMetrics | null; trackName: string }> = ({ metrics, trackName }) => {
    if (!metrics) {
        return null;
    }
    
    return (
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
                Key Performance Indicators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <KeyMetric
                    icon={<ClockIcon className="w-10 h-10" />}
                    label={`Simulated Lap Time (${trackName})`}
                    value={metrics?.simulatedLapTime ?? '--:--.---'}
                    unit=""
                    description="Projected lap time on the selected benchmark circuit, representing overall car performance."
                />
                <KeyMetric
                    icon={<SpeedometerIcon className="w-10 h-10" />}
                    label="Top Speed"
                    value={metrics?.topSpeedKmh.toFixed(1) ?? '---.-'}
                    unit="km/h"
                    description="The car's maximum achievable speed on a long straight, heavily influenced by aero drag."
                />
                <KeyMetric
                    icon={<ArrowTrendingUpIcon className="w-10 h-10" />}
                    label="Max Cornering G"
                    value={metrics?.maxCorneringG.toFixed(2) ?? '-.--'}
                    unit="G"
                    description="The peak lateral G-force in high-speed corners, a direct measure of aerodynamic downforce."
                />
            </div>
        </div>
    );
};

export default KeyMetricsDisplay;
