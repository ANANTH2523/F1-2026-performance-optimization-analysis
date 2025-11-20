import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import ParameterSlider from './components/ParameterSlider';
import AnalysisDisplay from './components/AnalysisDisplay';
import PerformanceChart from './components/PerformanceChart';
import { CarParameters, PerformanceMetrics } from './types';
import { analyzeCarPerformance, generateAeroFlowImage } from './services/geminiService';
import Loader from './components/Loader';
import { AnalyzeIcon } from './components/icons/AnalyzeIcon';
import { ExportIcon } from './components/icons/ExportIcon';
import CarVisualization from './components/CarVisualization';
import SensitivityChart from './components/SensitivityChart';
import TyreAnalysis from './components/TyreAnalysis';
import KeyMetricsDisplay from './components/KeyMetricsDisplay';
import { tracks } from './data/tracks';
import TrackSelector from './components/TrackSelector';

const tyreCompoundTooltip = (
  <div className="text-left">
    <p className="mb-2">Each compound offers a different balance between peak grip and durability:</p>
    <ul className="list-disc list-inside space-y-1 text-xs">
      <li><strong>C5 (Softest):</strong> Maximum grip, ideal for qualifying. Very high degradation, short race stint life.</li>
      <li><strong>C4 (Soft):</strong> High grip with slightly better durability than C5. An aggressive race compound.</li>
      <li><strong>C3 (Medium):</strong> A balanced, versatile compound. The most common choice for race stints, offering a good blend of performance and life.</li>
      <li><strong>C2 (Hard):</strong> Focuses on durability over one-lap pace. Used for long stints or on high-degradation tracks.</li>
      <li><strong>C1 (Hardest):</strong> Maximum durability, lowest peak grip. A strategic option for very long one-stop races or extreme conditions.</li>
    </ul>
  </div>
);


const App: React.FC = () => {
  const [params, setParams] = useState<CarParameters>({
    aeroDownforce: 60,
    aeroDrag: 55,
    frontWingFlapAngle: 10,
    suspensionStiffness: 70,
    tyreCompound: 2,
    enginePowerICE: 530,
    enginePowerMGU: 350,
    batteryEnergyDeployment: 90,
    chassisWeightKg: 725,
  });

  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0].id);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [flowImageUrl, setFlowImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTrack = useMemo(() => tracks.find(t => t.id === selectedTrackId)!, [selectedTrackId]);

  const handleParamChange = useCallback((param: keyof CarParameters, value: number) => {
    setParams((prev) => {
      const newParams = { ...prev, [param]: value };

      if (param === 'frontWingFlapAngle') {
        const newDownforce = 20 + (value / 20) * 80;
        newParams.aeroDownforce = parseFloat(newDownforce.toFixed(1));
        newParams.aeroDrag = parseFloat(Math.max(20, Math.min(100, 110 - newDownforce * 0.9)).toFixed(1));
      } else if (param === 'aeroDownforce') {
        const newAngle = ((value - 20) / 80) * 20;
        newParams.frontWingFlapAngle = parseFloat(newAngle.toFixed(1));
        newParams.aeroDrag = parseFloat(Math.max(20, Math.min(100, 110 - value * 0.9)).toFixed(1));
      } else if (param === 'aeroDrag') {
        const newDownforce = (110 - value) / 0.9;
        newParams.aeroDownforce = parseFloat(Math.max(20, Math.min(100, newDownforce)).toFixed(1));
        const newAngle = ((newParams.aeroDownforce - 20) / 80) * 20;
        newParams.frontWingFlapAngle = parseFloat(newAngle.toFixed(1));
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

    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) {
      setError("Selected track not found.");
      setIsLoading(false);
      return;
    }

    try {
      const [analysisResult, imageUrl] = await Promise.all([
        analyzeCarPerformance(params, track),
        generateAeroFlowImage(params)
      ]);
      setMetrics(analysisResult.metrics);
      setAnalysis(analysisResult.analysis);
      setFlowImageUrl(imageUrl);
    } catch (err) {
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = useCallback(() => {
    if (!metrics) {
      return;
    }

    const headers = ["Category", "Parameter", "Value"];
    const paramRows = Object.entries(params).map(([key, value]) => ["Parameter", key, value]);
    const metricRows = Object.entries(metrics).map(([key, value]) => ["Metric", key, typeof value === 'number' ? value.toFixed(4) : value]);

    const allRows = [
      headers,
      ...paramRows,
      ...metricRows
    ];

    const csvContent = allRows.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `f1_2026_analysis_${selectedTrackId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [params, metrics, selectedTrackId]);

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6 bg-gray-800/50 p-6 rounded-lg border border-gray-700 h-fit">
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
            Regulation Parameters
          </h2>
          <TrackSelector
            tracks={tracks}
            selectedTrackId={selectedTrackId}
            onSelectTrack={setSelectedTrackId}
          />
          <ParameterSlider
            label="Front Wing Flap Angle"
            value={params.frontWingFlapAngle}
            min={0} max={20} step={0.5} unit="deg"
            description="Adjusts front-end downforce. Higher angle increases front grip."
            onChange={(v) => handleParamChange('frontWingFlapAngle', v)}
            tooltipText="A critical setup tool for tuning aerodynamic balance. A higher angle helps reduce understeer and improves turn-in, but can make the rear unstable if not balanced."
            optimalRange={[10, 16]}
          />
          <ParameterSlider
            label="Aero Downforce"
            value={params.aeroDownforce}
            min={20} max={100} step={1} unit=""
            description="Overall downforce level. Higher improves cornering but increases drag."
            onChange={(v) => handleParamChange('aeroDownforce', v)}
            tooltipText="Adjusts the active aero system's baseline for high-downforce 'Z-mode'. Affects grip in medium to high-speed corners."
            optimalRange={[70, 95]}
          />
          <ParameterSlider
            label="Aero Drag"
            value={params.aeroDrag}
            min={20} max={100} step={1} unit=""
            description="Overall drag level. Lower improves top speed. Linked to Downforce."
            onChange={(v) => handleParamChange('aeroDrag', v)}
            tooltipText="Represents the car's efficiency in low-drag 'X-mode'. Lower values are crucial for tracks with long straights."
            optimalRange={[25, 45]}
          />
          <ParameterSlider
            label="Suspension Stiffness"
            value={params.suspensionStiffness}
            min={20} max={100} step={1} unit=""
            description="Affects mechanical grip and stability over bumps and kerbs."
            onChange={(v) => handleParamChange('suspensionStiffness', v)}
            tooltipText="A stiffer setup provides better aerodynamic platform stability, while a softer one improves ride over bumps and mechanical grip."
            optimalRange={[55, 80]}
          />
          <ParameterSlider
            label="Tyre Compound"
            value={params.tyreCompound}
            min={1} max={5} step={1} unit=""
            description="Affects the trade-off between peak grip and degradation over a stint."
            onChange={(v) => handleParamChange('tyreCompound', v)}
            tooltipText={tyreCompoundTooltip}
            displayValue={(v) => ['C5-Soft', 'C4-Soft', 'C3-Med', 'C2-Hard', 'C1-Hard'][v - 1]}
          />
          <ParameterSlider
            label="Chassis Weight"
            value={params.chassisWeightKg}
            min={720} max={760} step={1} unit="kg"
            description="Total car weight. Lower weight improves acceleration and braking."
            onChange={(v) => handleParamChange('chassisWeightKg', v)}
            tooltipText="Represents the base weight of the car. The 2026 regulations aim for lighter cars, but achieving the minimum weight is a challenge."
            optimalRange={[720, 730]}
          />
          <ParameterSlider
            label="ICE Power"
            value={params.enginePowerICE}
            min={500} max={550} step={1} unit="kW"
            description="Power from the Internal Combustion Engine."
            onChange={(v) => handleParamChange('enginePowerICE', v)}
            tooltipText="The 2026 regulations mandate a roughly 50/50 power split. This is the output from the traditional engine component, running on 100% sustainable fuels."
            optimalRange={[540, 550]}
          />
          <ParameterSlider
            label="MGU-K Power"
            value={params.enginePowerMGU}
            min={300} max={350} step={1} unit="kW"
            description="Power from the Motor Generator Unit - Kinetic."
            onChange={(v) => handleParamChange('enginePowerMGU', v)}
            tooltipText="The electrical power component has been significantly increased to 350kW for 2026, playing a much larger role in overall performance and strategy."
            optimalRange={[345, 350]}
          />
          <ParameterSlider
            label="Battery Deployment"
            value={params.batteryEnergyDeployment}
            min={50} max={100} step={1} unit="%"
            description="Percentage of stored energy deployed per lap."
            onChange={(v) => handleParamChange('batteryEnergyDeployment', v)}
            tooltipText="Governs the strategy for deploying the 350kW from the MGU-K. A higher percentage gives more power but may drain the battery before the lap ends."
            optimalRange={[85, 100]}
          />
          <div className="pt-4 flex items-center gap-4">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="flex-grow w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-lg"
            >
              {isLoading ? 'Analyzing...' : <> <AnalyzeIcon className="w-6 h-6" /> Analyze Performance Matrix </>}
            </button>
            <button
              onClick={handleExportCsv}
              disabled={!metrics || isLoading}
              className="shrink-0 py-3 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
              title="Export Data as CSV"
            >
              <ExportIcon className="w-6 h-6" />
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
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
              <KeyMetricsDisplay metrics={metrics} trackName={selectedTrack.name} />
              <TyreAnalysis metrics={metrics} />
              <AnalysisDisplay analysis={analysis} />
            </>
          )}
        </div>
      </main>
      <footer className="container mx-auto p-4 md:p-8 mt-8">
        <SensitivityChart currentParams={params} selectedTrackId={selectedTrackId} />
      </footer>
    </div>
  );
};

export default App;