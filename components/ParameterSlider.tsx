
import React, { useMemo } from 'react';
import { InfoIcon } from './icons/InfoIcon';

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
  onChange: (value: number) => void;
  tooltipText?: React.ReactNode;
  displayValue?: (value: number) => string;
  optimalRange?: [number, number];
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  description,
  onChange,
  tooltipText,
  displayValue,
  optimalRange,
}) => {
  const rangePercentage = useMemo(() => {
    if (!optimalRange) return { left: '0%', width: '0%' };
    
    const totalRange = max - min;
    if (totalRange <= 0) return { left: '0%', width: '0%' };

    const left = ((optimalRange[0] - min) / totalRange) * 100;
    const width = ((optimalRange[1] - optimalRange[0]) / totalRange) * 100;

    return {
      left: `${Math.max(0, Math.min(100, left))}%`,
      width: `${Math.max(0, Math.min(100, width))}%`,
    };
  }, [min, max, optimalRange]);
  
  return (
    <div className="group space-y-2 py-1">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2 cursor-help relative">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{label}</span>
            {tooltipText && (
                <div className="group/tooltip relative">
                     <InfoIcon className="w-3.5 h-3.5 text-gray-600 hover:text-blue-400 transition-colors" />
                     <div className="absolute bottom-full left-0 mb-2 w-64 p-3 text-xs text-gray-200 bg-gray-900/95 border border-gray-700 rounded shadow-xl backdrop-blur-sm opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="font-bold text-blue-400 mb-1 border-b border-gray-700 pb-1 uppercase tracking-wider">Metric Definition</div>
                        {tooltipText}
                    </div>
                </div>
            )}
        </div>
        <div className="font-mono text-sm font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/30 min-w-[3rem] text-center">
          {displayValue ? displayValue(value) : `${value}${unit}`}
        </div>
      </div>
      
      <div className="relative h-6 w-full flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-1 bg-gray-800 rounded-sm overflow-hidden">
             {/* Fill from left to value */}
             <div 
                className="h-full bg-blue-900/50" 
                style={{ width: `${((value - min) / (max - min)) * 100}%` }}
             ></div>
        </div>
        
        {/* Optimal Range Indicator */}
        {optimalRange && (
           <div
            className="absolute h-1.5 bg-green-500/40 border-x border-green-500/60 z-10"
            style={{ left: rangePercentage.left, width: rangePercentage.width, top: 'calc(50% - 3px)' }}
            title={`Optimal: ${optimalRange[0]} - ${optimalRange[1]}`}
          ></div>
        )}

        {/* The Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full z-20"
        />
      </div>
    </div>
  );
};

export default ParameterSlider;