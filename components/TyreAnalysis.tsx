
import React from 'react';
import { PerformanceMetrics } from '../types';

interface TyreAnalysisProps {
  metrics: PerformanceMetrics | null;
}

const TyreAnalysis: React.FC<TyreAnalysisProps> = React.memo(({ metrics }) => {
  const tyreWearIndex = metrics?.tyreWearIndex;

  const renderPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-32 text-gray-600">
      <span className="text-xs uppercase tracking-wider">Tyre Data Unavailable</span>
    </div>
  );

  const renderAnalysis = () => {
    if (tyreWearIndex === undefined) {
      return renderPlaceholder();
    }

    const tyreLifePercentage = Math.max(0, (1 - (tyreWearIndex - 1) / 9) * 100);

    const getWearColor = (percentage: number) => {
      if (percentage > 66) return 'bg-gradient-to-r from-green-500 to-emerald-400';
      if (percentage > 33) return 'bg-gradient-to-r from-yellow-500 to-amber-400';
      return 'bg-gradient-to-r from-red-600 to-orange-500';
    };

    const getWearLabel = (index: number) => {
      if (index <= 3) return "LOW DEG";
      if (index <= 7) return "MEDIUM DEG";
      return "CRITICAL DEG";
    };

    return (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Est. Stint Life</span>
            <span className="font-mono text-xl font-bold text-white">{tyreLifePercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-900 rounded-sm h-3 overflow-hidden border border-gray-700">
            <div
              className={`h-full transition-all duration-1000 ease-out ${getWearColor(tyreLifePercentage)}`}
              style={{ width: `${tyreLifePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
             <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                 <div className="text-[9px] text-gray-500 uppercase">Wear Index</div>
                 <div className="text-lg font-mono text-gray-200">{tyreWearIndex.toFixed(1)}<span className="text-xs text-gray-600">/10</span></div>
             </div>
             <div className="bg-gray-900/50 p-2 rounded border border-gray-700 flex items-center justify-center">
                 <div className={`text-xs font-bold ${tyreLifePercentage > 33 ? 'text-gray-300' : 'text-red-400'}`}>
                     {getWearLabel(tyreWearIndex)}
                 </div>
             </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-md p-5 rounded-lg border border-gray-700/50 h-full shadow-lg flex flex-col justify-center">
      <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-widest border-b border-gray-700 pb-2">
        Tyre Degradation
      </h2>
      {metrics ? renderAnalysis() : renderPlaceholder()}
    </div>
  );
});

export default TyreAnalysis;
