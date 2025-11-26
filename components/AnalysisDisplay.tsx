
import React from 'react';

interface AnalysisDisplayProps {
  analysis: string;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = React.memo(({ analysis }) => {
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Basic markdown-like formatting
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={index} className="text-lg font-bold text-blue-300 mt-6 mb-3 uppercase tracking-wide border-b border-gray-700/50 pb-1">{line.slice(2, -2)}</h3>;
      }
      if (line.match(/^\d+\./)) {
        return <p key={index} className="ml-4 mb-2 text-gray-300 font-light"><span className="font-mono text-blue-500 mr-2">{line.split('.')[0]}.</span>{line.substring(line.indexOf('.')+1)}</p>;
      }
       if (line.startsWith('- ')) {
        return <li key={index} className="ml-6 mb-1 text-gray-400 marker:text-blue-500/50 pl-2">{line.slice(2)}</li>;
      }
      return <p key={index} className="mb-2 text-gray-300 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-lg border border-gray-700/50 h-full overflow-y-auto shadow-lg custom-scrollbar">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-3">
          <div className="w-2 h-2 bg-blue-500 animate-pulse rounded-full"></div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">
            AI Strategy Engineer Report
          </h2>
      </div>
      {analysis ? (
        <div className="text-sm">
           {renderFormattedText(analysis)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-gray-600">
          <p className="text-sm font-mono uppercase tracking-wider">Awaiting Simulation Data</p>
        </div>
      )}
    </div>
  );
});

export default AnalysisDisplay;
