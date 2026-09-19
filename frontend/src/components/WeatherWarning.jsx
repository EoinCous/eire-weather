import { useWeather } from "../hooks/useWeather";

// Helper for Warning Level visual styling (Yellow / Orange / Red)
const getWarningLevelStyles = (level) => {
  const l = (level || '').toLowerCase();
  if (l.includes('red')) {
    return {
      bg: 'bg-red-950/60 border-red-500/80 shadow-red-950/50',
      badge: 'bg-red-600 text-white font-bold',
      text: 'text-red-100',
      subText: 'text-red-300/80',
      icon: <ShieldAlert className="w-6 h-6 text-red-400 flex-shrink-0 animate-pulse" />
    };
  }
  if (l.includes('orange')) {
    return {
      bg: 'bg-orange-950/50 border-orange-500/70 shadow-orange-950/50',
      badge: 'bg-orange-500 text-slate-950 font-bold',
      text: 'text-orange-100',
      subText: 'text-orange-300/80',
      icon: <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
    };
  }
  // Yellow default
  return {
    bg: 'bg-amber-950/40 border-amber-500/60 shadow-amber-950/30',
    badge: 'bg-amber-400 text-slate-950 font-bold',
    text: 'text-amber-100',
    subText: 'text-amber-300/80',
    icon: <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
  };
};

export default function WeatherWarning() {
    const { warnings } = useWeather();
    return(
        <div>
            {/* Active Weather Warnings Banner */}
            {warnings && warnings.length > 0 && (
            <section className="space-y-4">
                {warnings.map((warning, idx) => {
                const styles = getWarningLevelStyles(warning.level);
                return (
                    <div 
                    key={warning.id || idx}
                    className={`border rounded-2xl p-4 md:p-5 shadow-xl transition-all ${styles.bg}`}
                    >
                    <div className="flex items-start gap-3 md:gap-4">
                        {styles.icon}
                        <div className="flex-1 space-y-3">
                        
                        {/* Top Badges: Level, Type, Severity, Certainty */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider ${styles.badge}`}>
                            Status {warning.level || 'Yellow'}
                            </span>
                            {warning.type && (
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                                • {warning.type} Warning
                            </span>
                            )}
                            {warning.severity && (
                            <span className="text-[11px] font-medium text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-full bg-slate-900/40">
                                Severity: {warning.severity}
                            </span>
                            )}
                            {warning.certainty && (
                            <span className="text-[11px] font-medium text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-full bg-slate-900/40">
                                Certainty: {warning.certainty}
                            </span>
                            )}
                        </div>

                        {/* Main Content: Headline and Description */}
                        <div>
                            <h3 className={`font-bold text-base md:text-lg leading-snug ${styles.text}`}>
                            {warning.headline || `${warning.type || 'Weather'} Warning`}
                            </h3>
                            {warning.description && (
                            <p className={`text-xs md:text-sm mt-1.5 leading-relaxed ${styles.subText}`}>
                                {warning.description}
                            </p>
                            )}
                        </div>

                        {/* Affected Regions */}
                        {warning.regions && warning.regions.length > 0 && (
                            <div className="flex items-start gap-2 bg-slate-950/20 p-2 rounded-lg border border-slate-800/30">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-300 leading-relaxed">
                                <span className="font-semibold text-slate-200">Affected Regions: </span>
                                {warning.regions.join(', ')}
                            </p>
                            </div>
                        )}

                        {/* Timing: Onset, Expiry, and Updated Time */}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-800/40">
                            <div className="flex flex-wrap items-center gap-4">
                            {warning.onset && (
                                <span><strong className="text-slate-300">Valid from:</strong> {new Date(warning.onset).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            )}
                            {warning.expiry && (
                                <span><strong className="text-slate-300">Until:</strong> {new Date(warning.expiry).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            )}
                            </div>
                            {warning.updated && (
                            <span className="text-slate-500 italic">
                                Updated: {new Date(warning.updated).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                            )}
                        </div>

                        </div>
                    </div>
                    </div>
                );
                })}
            </section>
            )}
        </div>
    )
}