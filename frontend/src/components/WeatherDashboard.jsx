import { useWeather } from '../hooks/useWeather';
import { 
  Droplet, MapPin, Loader2, AlertCircle, AlertTriangle, ShieldAlert 
} from 'lucide-react';
import WeatherChart from './WeatherChart';
import DailyForecast from './DailyForecast';
import CurrentConditions from './CurrentConditions';
import { WeatherIcon } from './WeatherIcon';

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

export default function WeatherDashboard() {

  const { weather, warnings, locationName, loading, error, requestLocation } = useWeather();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Fetching forecast...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-6 text-center max-w-md flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-red-400 font-semibold mb-1">Error Loading Forecast</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { current, hourlyForecasts } = weather;

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 md:px-6 shadow-lg">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ÉireWeather
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{locationName}</span>
            </div>
          </div>
          <button 
            onClick={() => requestLocation() }
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors text-white rounded-xl shadow-md"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Current Location</span>
          </button>
        </header>

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

        {/* Current Conditions */}
        <CurrentConditions current={current} />

        {hourlyForecasts && <WeatherChart hourlyData={hourlyForecasts} />}

        {hourlyForecasts && (
          <DailyForecast hourlyForecasts={hourlyForecasts} WeatherIcon={WeatherIcon} />
        )}

        {/* Hourly Carousel */}
        <section className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Hourly Forecast
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {hourlyForecasts.slice(0, 24).map((item, idx) => (
              <div 
                key={item.timestamp || idx}
                className="flex-shrink-0 w-24 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-between gap-3 hover:bg-slate-800 transition-colors group cursor-default"
              >
                <span className="text-xs text-slate-400 font-medium group-hover:text-slate-300">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="text-slate-300 group-hover:text-blue-400 transition-colors">
                  <WeatherIcon symbol={item.weatherSymbol} className="w-8 h-8" />
                </div>
                <span className="text-lg font-bold text-slate-100">
                  {item.temperatureC != null ? `${Math.round(item.temperatureC)}°` : '--'}
                </span>
                <div className="h-4 flex items-center">
                  {item.precipitationMm > 0 && (
                    <span className="text-[11px] text-blue-400/90 font-medium flex items-center gap-1">
                      <Droplet className="w-3 h-3" /> {item.precipitationMm}mm
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}