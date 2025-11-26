
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
import { SparklesIcon } from './components/icons/SparklesIcon';
import { CompareIcon } from './components/icons/CompareIcon';
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

// Configuration for optimal ranges based on Track Downforce Level
const TRACK_SETUP_CONFIG: Record<string, Partial<Record<keyof CarParameters, [number, number]>>> = {
  max: { // Monaco
    aeroDownforce: [90, 100],
    aeroDrag: [45, 60],
    frontWingFlapAngle: [16, 20],
    suspensionStiffness: [30, 50],
    tyreCompound: [4, 5],
  },
  high: { // Barcelona, Silverstone
    aeroDownforce: [70, 90],
    aeroDrag: [30, 45],
    frontWingFlapAngle: [12, 16],
    suspensionStiffness: [60, 80],
    tyreCompound: [2, 4],
  },
  medium: { // Spa
    aeroDownforce: [50, 70],
    aeroDrag: [25, 40],
    frontWingFlapAngle: [8, 12],
    suspensionStiffness: [65, 85],
    tyreCompound: [2, 3],
  },
  low: { // Monza
    aeroDownforce: [25, 45],
    aeroDrag: [20, 30],
    frontWingFlapAngle: [2, 8],
    suspensionStiffness: [70, 90],
    tyreCompound: [2, 3],
  }
};

const BASE_OPTIMAL: Partial<Record<keyof CarParameters, [number, number]>> = {
    enginePowerICE: [540, 550],
    enginePowerMGU: [345, 350],
    batteryEnergyDeployment: [90, 100],
    chassisWeightKg: [720, 725],
};

const SectionHeader: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6 bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-2 mb-3">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
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
  const [baselineMetrics, setBaselineMetrics] = useState<PerformanceMetrics | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [flowImageUrl, setFlowImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTrack = useMemo(() => tracks.find(t => t.id === selectedTrackId)!, [selectedTrackId]);

  // Determine optimal ranges based on current track
  const currentOptimalRanges = useMemo(() => {
    const trackConfig = TRACK_SETUP_CONFIG[selectedTrack.downforceLevel] || TRACK_SETUP_CONFIG['high'];
    return { ...BASE_OPTIMAL, ...trackConfig } as Record<keyof CarParameters, [number, number]>;
  }, [selectedTrack]);

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

  const handleAutoOptimize = useCallback(() => {
    const newParams = { ...params };
    
    Object.keys(currentOptimalRanges).forEach((key) => {
        const paramKey = key as keyof CarParameters;
        const [min, max] = currentOptimalRanges[paramKey];
        let mid = (min + max) / 2;
        
        // Rounding logic based on parameter type for cleaner UI values
        if (paramKey === 'tyreCompound') {
            mid = Math.round(mid);
        } else if (paramKey === 'frontWingFlapAngle') {
            mid = Math.round(mid * 2) / 2; // Nearest 0.5
        } else {
            mid = Math.round(mid); // Nearest Integer
        }

        newParams[paramKey] = mid;
    });

    // Run the linked parameter logic one last time to ensure consistency (e.g. sync drag/downforce)
    const newDownforce = newParams.aeroDownforce;
    const calculatedAngle = ((newDownforce - 20) / 80) * 20;
    const calculatedDrag = Math.max(20, Math.min(100, 110 - newDownforce * 0.9));
    
    newParams.frontWingFlapAngle = parseFloat(calculatedAngle.toFixed(1));
    newParams.aeroDrag = parseFloat(calculatedDrag.toFixed(1));

    setParams(newParams);
  }, [currentOptimalRanges, params]);

  const handleSetBaseline = useCallback(() => {
    if (metrics) {
      if (baselineMetrics) {
        setBaselineMetrics(null); // Clear if already set
      } else {
        setBaselineMetrics(metrics); // Set current as baseline
      }
    }
  }, [metrics, baselineMetrics]);

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
        generateAeroFlowImage(params, track)
      ]);
      setMetrics(analysisResult.metrics);
      setAnalysis(analysisResult.analysis);
      setFlowImageUrl(imageUrl);
    } catch (err) {
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      if (errorMessage.includes('API_KEY_MISSING')) {
        setError(
            'API Key Missing: Please create a .env file in the root directory with "API_KEY=your_actual_api_key".'
        );
      } else {
        setError(errorMessage);
      }
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
    <div className="min-h-screen font-sans flex flex-col">
      <Header />
      
      {/* Main Grid: Increased gap from 6 to 8 for better spacing */}
      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls (Span 4) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col h-full">
            <div className="bg-gray-800/60 backdrop-blur-md p-5 rounded-lg border border-gray-700/50 shadow-xl flex-shrink-0">
                <TrackSelector
                    tracks={tracks}
                    selectedTrackId={selectedTrackId}
                    onSelectTrack={setSelectedTrackId}
                />
                
                <button
                    onClick={handleAutoOptimize}
                    className="w-full group relative flex items-center justify-center gap-2 py-3 px-4 bg-teal-900/30 hover:bg-teal-800/40 text-teal-300 text-xs font-bold uppercase tracking-wider rounded border border-teal-700/50 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-teal-500/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <SparklesIcon className="w-4 h-4" />
                    Auto-Config: {selectedTrack.name.split(' ')[0]} Setup
                </button>
            </div>

            {/* Scrollable controls area to ensure it doesn't push page too long */}
            <div className="bg-gray-800/60 backdrop-blur-md p-5 rounded-lg border border-gray-700/50 shadow-xl overflow-y-auto max-h-[600px] custom-scrollbar flex-grow">
                <SectionHeader title="Aerodynamics">
                    <ParameterSlider
                        label="Front Wing Angle"
                        value={params.frontWingFlapAngle}
                        min={0} max={20} step={0.5} unit="°"
                        description="Front-end bite vs Balance"
                        onChange={(v) => handleParamChange('frontWingFlapAngle', v)}
                        tooltipText="Critical for aero balance. Higher angles increase front grip but move center of pressure forward."
                        optimalRange={currentOptimalRanges.frontWingFlapAngle}
                    />
                    <ParameterSlider
                        label="Downforce Index"
                        value={params.aeroDownforce}
                        min={20} max={100} step={1} unit=""
                        description="Overall grip level"
                        onChange={(v) => handleParamChange('aeroDownforce', v)}
                        tooltipText="Total vertical load generated. Higher values improve cornering speeds but typically increase drag."
                        optimalRange={currentOptimalRanges.aeroDownforce}
                    />
                    <ParameterSlider
                        label="Drag Coefficient"
                        value={params.aeroDrag}
                        min={20} max={100} step={1} unit=""
                        description="Air resistance"
                        onChange={(v) => handleParamChange('aeroDrag', v)}
                        tooltipText="Resistance to forward motion. Lower is better for straight line speed and efficiency."
                        optimalRange={currentOptimalRanges.aeroDrag}
                    />
                </SectionHeader>

                <SectionHeader title="Chassis & Dynamics">
                     <ParameterSlider
                        label="Suspension Stiffness"
                        value={params.suspensionStiffness}
                        min={20} max={100} step={1} unit=""
                        description="Ride & Platform control"
                        onChange={(v) => handleParamChange('suspensionStiffness', v)}
                        tooltipText="Stiffer suspension stabilizes aero platform but reduces mechanical grip over bumps."
                        optimalRange={currentOptimalRanges.suspensionStiffness}
                    />
                    <ParameterSlider
                        label="Tyre Compound"
                        value={params.tyreCompound}
                        min={1} max={5} step={1} unit=""
                        description="Grip vs Durability"
                        onChange={(v) => handleParamChange('tyreCompound', v)}
                        tooltipText={tyreCompoundTooltip}
                        displayValue={(v) => ['C1-Hard', 'C2-Hard', 'C3-Med', 'C4-Soft', 'C5-Soft'][v - 1]}
                        optimalRange={currentOptimalRanges.tyreCompound}
                    />
                    <ParameterSlider
                        label="Chassis Weight"
                        value={params.chassisWeightKg}
                        min={720} max={760} step={1} unit="kg"
                        description="Total mass"
                        onChange={(v) => handleParamChange('chassisWeightKg', v)}
                        tooltipText="Lower weight always improves acceleration, braking, and cornering."
                        optimalRange={currentOptimalRanges.chassisWeightKg}
                    />
                </SectionHeader>

                <SectionHeader title="Power Unit (PU)">
                    <ParameterSlider
                        label="ICE Output"
                        value={params.enginePowerICE}
                        min={500} max={550} step={1} unit="kW"
                        description="Combustion Engine"
                        onChange={(v) => handleParamChange('enginePowerICE', v)}
                        tooltipText="Power from the V6 Turbo Internal Combustion Engine."
                        optimalRange={currentOptimalRanges.enginePowerICE}
                    />
                    <ParameterSlider
                        label="MGU-K Output"
                        value={params.enginePowerMGU}
                        min={300} max={350} step={1} unit="kW"
                        description="Electric Motor"
                        onChange={(v) => handleParamChange('enginePowerMGU', v)}
                        tooltipText="Power from the kinetic energy recovery system. 350kW limit."
                        optimalRange={currentOptimalRanges.enginePowerMGU}
                    />
                    <ParameterSlider
                        label="Deployment Mode"
                        value={params.batteryEnergyDeployment}
                        min={50} max={100} step={1} unit="%"
                        description="Energy usage strategy"
                        onChange={(v) => handleParamChange('batteryEnergyDeployment', v)}
                        tooltipText="Aggressiveness of electrical energy deployment over a lap."
                        optimalRange={currentOptimalRanges.batteryEnergyDeployment}
                    />
                </SectionHeader>
            </div>
            
             {/* Action Bar */}
             <div className="flex gap-2 p-2 bg-gray-900/80 rounded-lg border border-gray-700/50 backdrop-blur flex-shrink-0">
               <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="flex-grow flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold rounded shadow-lg shadow-blue-900/40 transition-all active:scale-[0.98]"
              >
                  {isLoading ? 'Simulating...' : <> <AnalyzeIcon className="w-5 h-5" /> RUN SIMULATION </>}
              </button>
              
              <button
                  onClick={handleSetBaseline}
                  disabled={!metrics || isLoading}
                  className={`flex-shrink-0 p-3 rounded border transition-colors ${
                    baselineMetrics 
                      ? 'bg-amber-900/30 border-amber-500/50 text-amber-400 hover:bg-amber-900/50' 
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={baselineMetrics ? "Clear Baseline" : "Compare"}
              >
                  <CompareIcon className="w-5 h-5" />
              </button>

              <button
                  onClick={handleExportCsv}
                  disabled={!metrics || isLoading}
                  className="flex-shrink-0 p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded border border-gray-600 transition-colors"
                  title="Export Data"
              >
                  <ExportIcon className="w-5 h-5" />
              </button>
             </div>
             
             {error && (
                <div className="p-3 bg-red-900/20 border-l-2 border-red-500 text-red-300 text-xs mt-2 rounded-r">
                   <strong className="block uppercase text-[10px] tracking-wider mb-1">System Error</strong>
                   {error}
                </div>
             )}
        </div>

        {/* Center & Right: Results (Span 8) */}
        <div className="lg:col-span-8 space-y-6 flex flex-col h-full min-w-0">
            {isLoading ? <Loader /> : (
                <>
                {/* Top Row: Visuals & Chart */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[400px]">
                    <div className="h-full">
                         <CarVisualization flowImageUrl={flowImageUrl} params={params} isLoading={isLoading} />
                    </div>
                    <div className="h-full">
                        <PerformanceChart metrics={metrics} baselineMetrics={baselineMetrics} />
                    </div>
                </div>
                 
                 {/* Middle Row: Metrics - Switch to stacking on LG to prevent cramping */}
                 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                     <div className="xl:col-span-2 min-w-0">
                        <KeyMetricsDisplay metrics={metrics} baselineMetrics={baselineMetrics} trackName={selectedTrack.name} />
                     </div>
                     <div className="xl:col-span-1 min-w-0">
                        <TyreAnalysis metrics={metrics} />
                     </div>
                 </div>

                 {/* Bottom Row: Text Analysis */}
                 <div className="flex-grow min-h-[300px]">
                    <AnalysisDisplay analysis={analysis} />
                 </div>
                </>
            )}
        </div>
      </main>
      
      {/* Footer / Sensitivity */}
      <footer className="container mx-auto p-4 md:p-8 mt-4 border-t border-gray-800">
           <SensitivityChart currentParams={params} selectedTrackId={selectedTrackId} />
      </footer>
    </div>
  );
};

export default App;
