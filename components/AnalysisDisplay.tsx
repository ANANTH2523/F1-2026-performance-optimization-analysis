
import React from 'react';

interface AnalysisDisplayProps {
  analysis: string;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Basic markdown-like formatting
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={index} className="text-xl font-semibold text-blue-400 mt-4 mb-2">{line.slice(2, -2)}</h3>;
      }
      if (line.match(/^\d+\./)) {
        return <p key={index} className="ml-4 mb-1">{line}</p>;
      }
       if (line.startsWith('- ')) {
        return <li key={index} className="ml-6 list-disc">{line.slice(2)}</li>;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
        AI Performance Analysis
      </h2>
      {analysis ? (
        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
           {renderFormattedText(analysis)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          <p className="text-lg">Your analysis will appear here.</p>
          <p>Configure parameters and click "Analyze".</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;
