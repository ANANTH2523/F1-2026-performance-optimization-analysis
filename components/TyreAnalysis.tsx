import React from 'react';
import { PerformanceMetrics } from '../types';

interface TyreAnalysisProps {
  metrics: PerformanceMetrics | null;
}

const TyreAnalysis: React.FC<TyreAnalysisProps> = ({ metrics }) => {
  const tyreWearIndex = metrics?.tyreWearIndex;

  const renderPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-24 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16a4 4 0 100-8 4 4 0 000 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.414 1.414M17.66 17.66l1.414 1.414M4.93 19.07l1.414-1.414M17.66 6.34l1.414-1.414" />
      </svg>
      <p>Tyre analysis will appear here.</p>
    </div>
  );

  const renderAnalysis = () => {
    if (tyreWearIndex === undefined) {
      return renderPlaceholder();
    }

    const tyreLifePercentage = Math.max(0, (1 - (tyreWearIndex - 1) / 9) * 100);

    const getWearColor = (percentage: number) => {
      if (percentage > 66) return 'bg-green-500';
      if (percentage > 33) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    const getWearLabel = (index: number) => {
      if (index <= 3) return "Excellent Longevity";
      if (index <= 7) return "Average Wear";
      return "High Degradation";
    };

    return (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1 text-gray-300">
            <span className="font-medium">Projected Stint Life</span>
            <span className="font-mono text-lg text-white">{tyreLifePercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${getWearColor(tyreLifePercentage)}`}
              style={{ width: `${tyreLifePercentage}%` }}
            ></div>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-400">
            <strong>Wear Index:</strong> {tyreWearIndex.toFixed(1)} / 10
            <span className="ml-2 font-semibold">({getWearLabel(tyreWearIndex)})</span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            This metric predicts tyre degradation. A lower index means a flatter performance curve over a stint, enabling longer runs and more flexible strategies.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
        Tyre Wear Analysis
      </h2>
      {metrics ? renderAnalysis() : renderPlaceholder()}
    </div>
  );
};

export default TyreAnalysis;
