
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 border-b border-gray-800 bg-gray-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/20">
                F1
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wider leading-none">
                    2026 <span className="text-blue-500">PERFORMANCE</span> MODELER
                </h1>
                <p className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">Regulation Analysis & Optimization Unit</p>
            </div>
        </div>
        
        <div className="flex items-center gap-6 text-xs font-mono text-gray-500">
            <div className="hidden md:flex flex-col items-end">
                <span>SYSTEM_STATUS</span>
                <span className="text-green-500">ONLINE</span>
            </div>
            <div className="h-8 w-px bg-gray-700 hidden md:block"></div>
            <div className="hidden md:flex flex-col items-end">
                <span>VERSION</span>
                <span className="text-blue-400">v2.6.0-BETA</span>
            </div>
        </div>
      </div>
      {/* Decorative timeline ticks */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-900 to-transparent"></div>
      <div className="container mx-auto px-4 mt-px flex justify-between opacity-30">
        {[...Array(20)].map((_, i) => (
            <div key={i} className={`w-px h-1 ${i % 5 === 0 ? 'bg-blue-400 h-2' : 'bg-gray-600'}`}></div>
        ))}
      </div>
    </header>
  );
};

export default Header;