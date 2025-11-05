import React from 'react';
import { CarParameters } from '../types';

interface ComponentSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: CarParameters;
}

const ComponentSpecsModal: React.FC<ComponentSpecsModalProps> = ({ isOpen, onClose, params }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Car Specifications</h2>
        <ul>
          {Object.entries(params).map(([key, value]) => (
            <li key={key} className="flex justify-between py-2 border-b border-gray-600">
              <span className="font-medium text-gray-300">{key}</span>
              <span className="font-mono text-blue-400">{String(value)}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ComponentSpecsModal;
