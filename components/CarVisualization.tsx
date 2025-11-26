
import React, { useMemo } from 'react';
import { CarParameters } from '../types';

interface CarVisualizationProps {
  flowImageUrl: string | null;
  params: CarParameters;
  isLoading?: boolean;
}

const CarVisualization: React.FC<CarVisualizationProps> = ({ flowImageUrl, params, isLoading = false }) => {
  
  // Calculate visual intensities based on parameters (normalized 0-1)
  const visuals = useMemo(() => {
    const downforceIntensity = (params.aeroDownforce - 20) / 80; // 0.0 to 1.0
    const dragIntensity = (params.aeroDrag - 20) / 80; // 0.0 to 1.0
    
    // Wind speed: Lower drag = faster animation (shorter duration)
    // Range: 0.5s (fastest) to 3.0s (slowest)
    const windSpeedDuration = 0.5 + (dragIntensity * 2.5);

    return {
        downforceOpacity: Math.max(0.1, downforceIntensity), // Min visibility 0.1
        dragWakeScale: 0.5 + (dragIntensity * 1.5), // Scale 0.5 to 2.0
        dragWakeOpacity: 0.2 + (dragIntensity * 0.6), // Opacity 0.2 to 0.8
        windSpeed: `${windSpeedDuration}s`
    };
  }, [params]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg h-96 relative group overflow-hidden flex flex-col shadow-2xl shadow-black/50">
      
      {/* HUD Header */}
      <div className="absolute top-0 left-0 w-full p-3 z-40 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase font-bold">AERO_VIS // CFD_LIVE</span>
                 <div className="flex gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px] ${isLoading ? 'bg-yellow-500 shadow-yellow-500 animate-ping' : 'bg-green-500 shadow-green-500 animate-pulse'}`}></div>
                 </div>
              </div>
              <span className="text-[9px] text-gray-500 font-mono">
                  FLOW VELOCITY: {isLoading ? 'CALCULATING...' : `MACH ${(0.2 + (1 - (params.aeroDrag-20)/80)*0.1).toFixed(2)}`}
              </span>
          </div>
          <div className="text-[9px] text-gray-500 font-mono text-right">
              <span className="block">GRID: 50x50</span>
              <span className="block text-blue-400/70">{isLoading ? 'PROCESSING_GEOMETRY' : 'SIMULATION_ACTIVE'}</span>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full h-full bg-black/40 overflow-hidden">
         {/* Grid Background */}
         <div className="absolute inset-0 z-0 opacity-20" 
              style={{ 
                  backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)', 
                  backgroundSize: '40px 40px',
                  maskImage: 'radial-gradient(circle, black 40%, transparent 100%)'
              }}>
         </div>

         {/* Scanning Overlay (Active during loading) */}
         {isLoading && (
            <div className="absolute inset-0 z-50 bg-blue-900/10 flex items-center justify-center backdrop-blur-[2px]">
                <div className="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,1)] animate-scan-fast absolute top-0"></div>
                <div className="font-mono text-blue-400 text-xs tracking-[0.2em] animate-pulse">GENERATING MESH...</div>
            </div>
         )}

        {flowImageUrl ? (
          <div className="relative w-full h-full flex items-center justify-center transition-all duration-1000">
            {/* Base CFD Image */}
            <img
              src={flowImageUrl}
              alt="Aerodynamic Flow Visualization"
              className={`w-[90%] h-[90%] object-contain z-10 relative drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-opacity duration-500 ${isLoading ? 'opacity-50 blur-sm' : 'opacity-100'}`}
            />
            
            {/* DYNAMIC OVERLAY: High Pressure Zones (Downforce Visualization) */}
            {/* Front Wing Pressure */}
            <div 
                className="absolute top-[30%] left-1/2 -translate-x-1/2 w-32 h-16 bg-gradient-to-b from-red-500/0 via-red-500/40 to-red-500/0 blur-xl z-20 mix-blend-screen pointer-events-none rounded-full"
                style={{ opacity: visuals.downforceOpacity, animation: 'pulse-pressure 3s infinite' }}
            ></div>
            {/* Rear Wing Pressure */}
            <div 
                className="absolute top-[65%] left-1/2 -translate-x-1/2 w-40 h-20 bg-gradient-to-b from-orange-500/0 via-orange-500/40 to-orange-500/0 blur-xl z-20 mix-blend-screen pointer-events-none rounded-full"
                style={{ opacity: visuals.downforceOpacity, animation: 'pulse-pressure 3s infinite reverse' }}
            ></div>

            {/* DYNAMIC OVERLAY: Turbulent Wake (Drag Visualization) */}
            <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-gradient-to-t from-gray-100/10 via-blue-900/20 to-transparent blur-2xl z-0 pointer-events-none rounded-t-full"
                style={{ 
                    transform: `translateX(-50%) scale(${visuals.dragWakeScale})`, 
                    opacity: visuals.dragWakeOpacity,
                }}
            ></div>

            {/* Animated Scan Line (Subtle when loaded) */}
            <div className="absolute inset-x-0 h-[1px] bg-blue-400/30 z-30 animate-scan pointer-events-none top-0"></div>

             {/* Wind Streamlines (Dynamic Speed) */}
             <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
                {[...Array(10)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent blur-[0.5px] animate-wind"
                        style={{
                            top: `${10 + Math.random() * 80}%`,
                            left: '-20%',
                            width: '140%',
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${parseFloat(visuals.windSpeed) * (0.8 + Math.random() * 0.4)}s`, // Variation around base speed
                            opacity: 0.2 + Math.random() * 0.5
                        }}
                    ></div>
                ))}
             </div>
             
             {/* Particles (Drifting with flow) */}
              <div className="absolute inset-0 z-15 pointer-events-none">
                 {[...Array(20)].map((_, i) => (
                    <div
                       key={`p-${i}`}
                       className="absolute w-0.5 h-0.5 bg-white/40 rounded-full animate-particle"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: visuals.windSpeed // Particles follow wind speed
                        }}
                    ></div>
                 ))}
              </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full z-10 relative">
              <div className="mb-6 relative group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full animate-pulse"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-20 w-20 relative z-10 text-gray-600 transition-colors duration-300 ${isLoading ? 'text-blue-500 animate-pulse' : 'group-hover:text-blue-500/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  
                  {/* Rotating Rings */}
                  <div className={`absolute inset-0 border border-gray-700/50 rounded-full ${isLoading ? 'animate-[spin_2s_linear_infinite] border-blue-500/30' : 'animate-[spin_10s_linear_infinite]'}`}></div>
                  <div className={`absolute -inset-2 border border-dashed border-gray-800/50 rounded-full ${isLoading ? 'animate-[spin_3s_linear_infinite_reverse] border-blue-500/20' : 'animate-[spin_15s_linear_infinite_reverse]'}`}></div>
              </div>
              <p className="text-xl font-mono text-gray-500 tracking-wider group-hover:text-blue-400 transition-colors">
                  {isLoading ? 'GENERATING VISUAL...' : 'AWAITING INPUT'}
              </p>
              <div className="h-0.5 w-16 bg-gray-700 mt-2 overflow-hidden rounded-full">
                  <div className={`h-full bg-blue-500 w-1/3 ${isLoading ? 'animate-[shimmer_0.5s_infinite]' : 'animate-[shimmer_2s_infinite]'}`}></div>
              </div>
          </div>
        )}
      </div>
      
      {/* HUD Corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-blue-500/20 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-blue-500/20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-blue-500/20 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-blue-500/20 pointer-events-none"></div>

      {/* Decorative Side Rulers */}
      <div className="absolute left-1 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent flex flex-col justify-between py-2 items-center opacity-50">
         {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-px bg-gray-500"></div>)}
      </div>
       <div className="absolute right-1 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent flex flex-col justify-between py-2 items-center opacity-50">
         {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-px bg-gray-500"></div>)}
      </div>

      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes scan-fast {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
            animation: scan 4s ease-in-out infinite;
        }
        .animate-scan-fast {
             animation: scan-fast 1.5s linear infinite;
        }
        @keyframes wind {
            0% { transform: translateX(-20%); opacity: 0; }
            20% { opacity: 0.6; }
            80% { opacity: 0.6; }
            100% { transform: translateX(120%); opacity: 0; }
        }
        .animate-wind {
            animation: wind 3s linear infinite;
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
        }
        @keyframes particle {
             0% { transform: translateY(0) scale(1); opacity: 0; }
             50% { opacity: 0.5; }
             100% { transform: translateY(-20px) scale(0); opacity: 0; }
        }
        .animate-particle {
            animation: particle 4s ease-out infinite;
        }
        @keyframes pulse-pressure {
            0%, 100% { opacity: 0.3; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default CarVisualization;
