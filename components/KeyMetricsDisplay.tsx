
import React from 'react';
import { PerformanceMetrics } from '../types';
import { ClockIcon, SpeedometerIcon, ArrowTrendingUpIcon } from './icons/KeyMetricsIcons';

interface KeyMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  description: string;
  delta?: {
    value: string;
    isImprovement: boolean;
    isNeutral: boolean;
  };
}

const KeyMetric: React.FC<KeyMetricProps> = ({ icon, label, value, unit, description, delta }) => (
    <div className="bg-gray-800/80 p-4 rounded-lg relative group border border-gray-700/50 hover:border-blue-500/50 transition-colors shadow-lg overflow-hidden h-full flex flex-col justify-center min-h-[120px]">
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 blur transition duration-500 group-hover:duration-200"></div>
        
        <div className="relative bg-gray-900/90 h-full p-3 rounded flex items-center gap-4 z-10">
            <div className="flex-shrink-0 text-gray-500 group-hover:text-blue-400 transition-colors">
                {icon}
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1 truncate">{label}</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-2xl lg:text-3xl font-mono font-bold text-white tracking-tight whitespace-nowrap">
                        {value}
                    </p>
                    <span className="text-xs text-gray-500 font-mono">{unit}</span>
                </div>
                {delta && !delta.isNeutral && (
                    <div className={`text-xs font-bold font-mono mt-1 flex items-center gap-1 ${delta.isImprovement ? 'text-green-400' : 'text-red-400'}`}>
                        <span>{delta.isImprovement ? '▲' : '▼'}</span>
                        <span>{delta.value}</span>
                    </div>
                )}
                 {delta && delta.isNeutral && (
                     <div className="text-xs font-mono text-gray-600 mt-1">-</div>
                )}
            </div>
        </div>

         {/* Tooltip */}
         <div className="absolute top-0 right-0 m-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
         </div>
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2 text-[10px] text-center text-gray-200 bg-black/90 border border-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 backdrop-blur-sm shadow-xl">
            {description}
        </div>
    </div>
);

const ComparisonBanner: React.FC<{ current: PerformanceMetrics; baseline: PerformanceMetrics }> = ({ current, baseline }) => {
    const parseTime = (t: string) => {
        const parts = t.split(':');
        if (parts.length !== 2) return 0;
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    };

    const tCurrent = parseTime(current.simulatedLapTime);
    const tBaseline = parseTime(baseline.simulatedLapTime);
    
    // Avoid showing comparison if data is invalid
    if (tCurrent === 0 || tBaseline === 0) return null;

    const diff = tCurrent - tBaseline;
    const isImprovement = diff < 0;
    const isNeutral = Math.abs(diff) < 0.001;
    const absDiff = Math.abs(diff).toFixed(3);

    let styles = {
        bg: "bg-gray-800/50",
        border: "border-gray-600",
        text: "text-gray-400",
        title: "NO CHANGE"
    };

    if (!isNeutral) {
        if (isImprovement) {
            styles = {
                bg: "bg-emerald-900/40",
                border: "border-emerald-500/50",
                text: "text-emerald-400",
                title: "LAP TIME IMPROVED"
            };
        } else {
            styles = {
                bg: "bg-red-900/40",
                border: "border-red-500/50",
                text: "text-red-400",
                title: "LAP TIME INCREASED"
            };
        }
    }

    return (
        <div className={`mb-4 rounded-lg border ${styles.border} ${styles.bg} p-4 flex items-center justify-between shadow-lg backdrop-blur relative overflow-hidden transition-all duration-500`}>
             <div className="relative z-10">
                <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${styles.text} flex items-center gap-2`}>
                   {styles.title}
                </h3>
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-3xl sm:text-4xl font-mono font-bold ${styles.text} tracking-tighter`}>
                        {isNeutral ? '0.000' : `${isImprovement ? '-' : '+'}${absDiff}`}
                    </span>
                    <span className={`text-xs sm:text-sm font-mono opacity-80 ${styles.text}`}>sec</span>
                </div>
             </div>

             <div className="relative z-10 text-right hidden sm:block">
                 <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono">
                     <span className="text-gray-500 uppercase tracking-wide text-[10px] text-right">Baseline</span>
                     <span className="text-gray-400 text-right">{baseline.simulatedLapTime}</span>
                     
                     <span className="text-gray-500 uppercase tracking-wide text-[10px] text-right">Current</span>
                     <span className="text-white font-bold text-right">{current.simulatedLapTime}</span>
                 </div>
             </div>
             
             {/* Subtle background glow */}
             <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${isImprovement ? 'bg-emerald-500' : (isNeutral ? 'bg-gray-500' : 'bg-red-500')}`}></div>
        </div>
    );
};

const KeyMetricsDisplay: React.FC<{ metrics: PerformanceMetrics | null; baselineMetrics: PerformanceMetrics | null; trackName: string }> = React.memo(({ metrics, baselineMetrics, trackName }) => {
    if (!metrics) {
        return null;
    }

    const getLapTimeDelta = (current: string, baseline: string) => {
        const parseTime = (t: string) => {
            const parts = t.split(':');
            if (parts.length !== 2) return 0;
            const min = parseFloat(parts[0]);
            const sec = parseFloat(parts[1]);
            return min * 60 + sec;
        };

        const t1 = parseTime(current);
        const t2 = parseTime(baseline);
        
        if (t1 === 0 || t2 === 0) return null;

        const diff = t1 - t2; 
        const isImprovement = diff < 0;
        const absDiff = Math.abs(diff);

        return {
            value: `${absDiff.toFixed(3)}s`,
            isImprovement: isImprovement,
            isNeutral: absDiff < 0.001
        };
    };

    const getNumericDelta = (current: number, baseline: number, higherIsBetter: boolean) => {
        const diff = current - baseline;
        const isImprovement = higherIsBetter ? diff > 0 : diff < 0;
        const absDiff = Math.abs(diff);

        return {
            value: absDiff.toFixed(2),
            isImprovement: isImprovement,
            isNeutral: absDiff < 0.01
        };
    };
    
    const lapTimeDelta = baselineMetrics ? getLapTimeDelta(metrics.simulatedLapTime, baselineMetrics.simulatedLapTime) : undefined;
    const speedDelta = baselineMetrics ? getNumericDelta(metrics.topSpeedKmh, baselineMetrics.topSpeedKmh, true) : undefined;
    const cornerDelta = baselineMetrics ? getNumericDelta(metrics.maxCorneringG, baselineMetrics.maxCorneringG, true) : undefined;

    return (
        <div className="space-y-4">
             <div className="flex items-center gap-2 justify-between">
                 <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                    <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Primary Telemetry</h2>
                 </div>
                 {baselineMetrics && (
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                            Baseline Active
                        </span>
                     </div>
                 )}
             </div>

            {baselineMetrics && (
                <ComparisonBanner current={metrics} baseline={baselineMetrics} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <KeyMetric
                    icon={<ClockIcon className="w-8 h-8" />}
                    label="Lap Time Prediction"
                    value={metrics?.simulatedLapTime ?? '--:--.---'}
                    unit=""
                    description={`Estimated lap time for ${trackName} based on current configuration.`}
                    delta={lapTimeDelta}
                />
                <KeyMetric
                    icon={<SpeedometerIcon className="w-8 h-8" />}
                    label="V-Max (DRS Open)"
                    value={metrics?.topSpeedKmh.toFixed(1) ?? '---.-'}
                    unit="km/h"
                    description="Maximum velocity at the end of the longest straight."
                    delta={speedDelta}
                />
                <KeyMetric
                    icon={<ArrowTrendingUpIcon className="w-8 h-8" />}
                    label="Peak Lateral G"
                    value={metrics?.maxCorneringG.toFixed(2) ?? '-.--'}
                    unit="G"
                    description="Maximum lateral force sustainable in high-speed corners."
                    delta={cornerDelta}
                />
            </div>
        </div>
    );
});

export default KeyMetricsDisplay;
