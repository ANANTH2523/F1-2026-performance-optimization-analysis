
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full text-center py-6 border-b border-gray-700/50">
      <h1 className="text-4xl font-bold text-white tracking-wider">
        F1<span className="text-blue-500">2026</span> Regulation Modeler
      </h1>
      <p className="text-gray-400 mt-2">AI-Powered Performance Analysis & Optimization</p>
    </header>
  );
};

export default Header;
