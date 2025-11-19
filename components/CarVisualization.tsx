import React from 'react';

interface CarVisualizationProps {
  flowImageUrl: string | null;
}

const CarVisualization: React.FC<CarVisualizationProps> = ({ flowImageUrl }) => {
  return (
    <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700 h-96 relative group overflow-hidden">
      {flowImageUrl ? (
        <div className="relative w-full h-full">
           {/* Base CFD Image */}
          <img
            src={flowImageUrl}
            alt="Aerodynamic Flow Visualization"
            className="w-full h-full object-contain z-10 relative"
          />
          
          {/* Animated Streamlines Layer - subtle flowing lines overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none opacity-40 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          
          {/* Turbulent Wake Pulse Animation */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full animate-pulse-slow z-0"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-lg font-semibold">Aero Flow Visualization</p>
            <p className="text-sm">Run analysis to generate CFD image.</p>
        </div>
      )}
      
      {/* Tooltip Label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30 border border-white/10">
        AI-Generated Aero Flow (CFD)
      </div>
    </div>
  );
};

export default CarVisualization;