import React, { useState, useEffect } from 'react';
import { Annotation, CarParameters } from '../types';
import { getF1ComponentSpecs } from '../services/geminiService';
import Loader from './Loader';

interface ComponentSpecsPanelProps {
  annotation: Annotation | null;
  carParams: CarParameters;
  onBack: () => void;
}

const ComponentSpecsModal: React.FC<ComponentSpecsPanelProps> = ({ annotation, carParams, onBack }) => {
  const [specs, setSpecs] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (annotation && carParams) {
      const fetchSpecs = async () => {
        setIsLoading(true);
        setError(null);
        setSpecs('');
        try {
          const result = await getF1ComponentSpecs(annotation.partName, carParams);
          setSpecs(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load technical specifications.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSpecs();
    }
  }, [annotation, carParams]);

  if (!annotation) {
    return null;
  }

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h3 key={index} className="text-2xl font-semibold text-blue-400 mt-4 mb-2">{line.slice(3)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-6 list-disc">{line.slice(2)}</li>;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 h-full flex flex-col">
      <div className="flex-shrink-0">
        <button 
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 mb-4 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Performance Analysis
        </button>
        <h2 className="text-3xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
          Technical Deep Dive: {annotation.partName}
        </h2>
      </div>
      <div className="overflow-y-auto pr-4 flex-grow">
        {isLoading && <Loader />}
        {error && <p className="text-red-400">{error}</p>}
        {!isLoading && !error && (
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {renderFormattedText(specs)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentSpecsModal;