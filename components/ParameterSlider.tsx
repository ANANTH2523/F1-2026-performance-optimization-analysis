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
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="relative group flex items-center gap-1.5 cursor-help">
          <label className="font-medium text-white">{label}</label>
          {tooltipText && (
            <>
              <InfoIcon className="w-4 h-4 text-gray-400" />
              <div className="absolute bottom-full left-0 mb-3 w-72 p-3 text-sm text-gray-200 bg-gray-900 border border-gray-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                <p className="font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">Technical Briefing</p>
                {tooltipText}
                 <div className="absolute top-full left-4 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-600"></div>
              </div>
            </>
          )}
        </div>
        <span className="px-2 py-1 text-sm font-mono rounded bg-gray-700 text-blue-400">
          {displayValue ? displayValue(value) : `${value} ${unit}`}
        </span>
      </div>
      <div className="relative h-2 w-full flex items-center">
        <div className="absolute w-full h-2 bg-gray-700 rounded-lg"></div>
        {optimalRange && (
           <div
            className="absolute h-2 bg-green-500/30 rounded-lg"
            style={{ left: rangePercentage.left, width: rangePercentage.width }}
            title={`Optimal range: ${optimalRange[0]}-${optimalRange[1]}`}
          ></div>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-2 appearance-none cursor-pointer range-lg accent-blue-500 bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent"
        />
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
};

export default ParameterSlider;