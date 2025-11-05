import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ParameterSlider from './components/ParameterSlider';
import AnalysisDisplay from './components/AnalysisDisplay';
import PerformanceChart from './components/PerformanceChart';
import { CarParameters, PerformanceMetrics } from './types';
import { analyzeCarPerformance, generateAeroFlowImage } from './services/geminiService';
import Loader from './components/Loader';
import { AnalyzeIcon } from './components/icons/AnalyzeIcon';
import CarVisualization from './components/CarVisualization';
import SensitivityChart from './components/SensitivityChart';

const App: React.FC = () => {
  const [params, setParams] = useState<CarParameters>({
    aeroDownforce: 60,
    aeroDrag: 55,
    suspensionStiffness: 70,
    tyreCompound: 2,
    enginePowerICE: 530,
    enginePowerMGU: 350,
    batteryEnergyDeployment: 90,
    chassisWeightKg: 725,
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [flowImageUrl, setFlowImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleParamChange = useCallback((param: keyof CarParameters, value: number) => {
    setParams((prev) => {
      const newParams = { ...prev, [param]: value };
      if (param === 'aeroDownforce') {
        newParams.aeroDrag = Math.max(20, Math.min(100, Math.round(110 - value * 0.9)));
      }
      return newParams;
    });
  }, []);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setMetrics(null);
    setAnalysis('');
    setFlowImageUrl(null);
    try {
      const [analysisResult, imageUrl] = await Promise.all([
        analyzeCarPerformance(params),
        generateAeroFlowImage(params)
      ]);
      setMetrics(analysisResult.metrics);
      setAnalysis(analysisResult.analysis);
      setFlowImageUrl(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6 bg-gray-800/50 p-6 rounded-lg border border-gray-700 h-fit">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
                Regulation Parameters
            </h2>
          <ParameterSlider
            label="Aero Downforce"
            value={params.aeroDownforce}
            min={20} max={100} step={1} unit=""
            description="Overall downforce level. Higher improves cornering but increases drag."
            onChange={(v) => handleParamChange('aeroDownforce', v)}
            tooltipText="Adjusts the active aero system's baseline for high-downforce 'Z-mode'. Affects grip in medium to high-speed corners."
          />
          <ParameterSlider
            label="Aero Drag"
            value={params.aeroDrag}
            min={20} max={100} step={1} unit=""
            description="Overall drag level. Lower improves top speed. Linked to Downforce."
            onChange={(v) => handleParamChange('aeroDrag', v)}
            tooltipText="Represents the car's efficiency in low-drag 'X-mode'. Lower values are crucial for tracks with long straights."
          />
          <ParameterSlider
            label="Suspension Stiffness"
            value={params.suspensionStiffness}
            min={20} max={100} step={1} unit=""
            description="Affects mechanical grip and stability over bumps and kerbs."
            onChange={(v) => handleParamChange('suspensionStiffness', v)}
            tooltipText="A stiffer setup provides better aerodynamic platform stability, while a softer one improves ride over bumps and mechanical grip."
          />
           <ParameterSlider
            label="Chassis Weight"
            value={params.chassisWeightKg}
            min={720} max={760} step={1} unit="kg"
            description="Total car weight. Lower weight improves acceleration and braking."
            onChange={(v) => handleParamChange('chassisWeightKg', v)}
            tooltipText="Represents the base weight of the car. The 2026 regulations aim for lighter cars, but achieving the minimum weight is a challenge."
          />
           <ParameterSlider
            label="Battery Deployment"
            value={params.batteryEnergyDeployment}
            min={50} max={100} step={1} unit="%"
            description="Percentage of stored energy deployed per lap."
            onChange={(v) => handleParamChange('batteryEnergyDeployment', v)}
            tooltipText="Governs the strategy for deploying the 350kW from the MGU-K. A higher percentage gives more power but may drain the battery before the lap ends."
          />
           <div className="pt-4">
             <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-lg"
            >
                {isLoading ? 'Analyzing...' : <> <AnalyzeIcon className="w-6 h-6" /> Analyze Performance Matrix </>}
            </button>
           </div>
           {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}
        </div>

        <div className="lg:col-span-2 space-y-8">
            {isLoading ? <Loader /> : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    <div className="md:col-span-2">
                        <CarVisualization flowImageUrl={flowImageUrl} />
                    </div>
                    <div className="md:col-span-3">
                        <PerformanceChart metrics={metrics} />
                    </div>
                </div>
                 <AnalysisDisplay analysis={analysis} />
                </>
            )}
        </div>
      </main>
      <footer className="container mx-auto p-4 md:p-8 mt-8">
           <SensitivityChart currentParams={params} />
      </footer>
    </div>
  );
};

export default App;