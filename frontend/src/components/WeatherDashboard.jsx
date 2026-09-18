import { useState, useEffect } from 'react';
import { useWeather } from '../hooks/useWeather';
import { 
  Sun, CloudSun, Cloud, CloudRain, CloudSnow, 
  CloudFog, Wind, Droplet, Gauge, MapPin, 
  CloudLightning, Loader2, AlertCircle, AlertTriangle, ShieldAlert 
} from 'lucide-react';
import WeatherChart from './WeatherChart';
import DailyForecast from './DailyForecast';

// Helper to map Met Éireann symbol codes to Lucide React SVG components
const WeatherIcon = ({ symbol, className = "w-8 h-8", strokeWidth = 2 }) => {
  if (!symbol) return <Cloud className={className} strokeWidth={strokeWidth} />;
  const s = symbol.toLowerCase();
  
  if (s.includes('thunder')) return <CloudLightning className={className} strokeWidth={strokeWidth} />;
  if (s.includes('snow') || s.includes('sleet')) return <CloudSnow className={className} strokeWidth={strokeWidth} />;
  if (s.includes('rain') || s.includes('drizzle') || s.includes('shower')) return <CloudRain className={className} strokeWidth={strokeWidth} />;
  if (s.includes('fog') || s.includes('mist')) return <CloudFog className={className} strokeWidth={strokeWidth} />;
  if (s.includes('cloud') && s.includes('sun')) return <CloudSun className={className} strokeWidth={strokeWidth} />;
  if (s.includes('sun') || s.includes('clear')) return <Sun className={className} strokeWidth={strokeWidth} />;
  if (s.includes('cloud')) return <Cloud className={className} strokeWidth={strokeWidth} />;
  
  return <CloudSun className={className} strokeWidth={strokeWidth} />;
};

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

        {/* Hero Card */}
        {current && (
          <section className="relative overflow-hidden bg-gradient-to-br from-blue-900/30 to-slate-900 border border-blue-500/20 rounded-3xl p-8 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 text-blue-500/10 blur-3xl">
               <WeatherIcon symbol={current.weatherSymbol} className="w-96 h-96" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4">
                  Current Conditions
                </span>
                <div className="flex items-start gap-1">
                  <span className="text-7xl md:text-8xl font-black text-white tracking-tighter">
                    {current.temperatureC}
                  </span>
                  <span className="text-3xl md:text-4xl text-blue-400 font-bold mt-2">°C</span>
                </div>
                <p className="text-slate-300 font-medium text-xl mt-2 capitalize flex items-center gap-2">
                  {current.weatherSymbol || 'Clear'}
                </p>
              </div>

              <div className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <WeatherIcon symbol={current.weatherSymbol} className="w-32 h-32 md:w-40 md:h-40" strokeWidth={1.5} />
              </div>
            </div>
          </section>
        )}

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

        {/* Metrics Grid */}
        {current && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              label="Wind Speed" 
              value={`${current.windSpeedMps ?? 0} m/s`} 
              subValue={current.windDirection} 
              icon={<Wind className="w-5 h-5 text-blue-400" />} 
            />
            <MetricCard 
              label="Humidity" 
              value={`${current.humidityPercent ?? 0}%`} 
              subValue="Relative" 
              icon={<Droplet className="w-5 h-5 text-blue-400" />} 
            />
            <MetricCard 
              label="Pressure" 
              value={`${current.pressureHpa ?? 0} hPa`} 
              subValue="Atmospheric" 
              icon={<Gauge className="w-5 h-5 text-blue-400" />} 
            />
            <MetricCard 
              label="Rainfall" 
              value={`${current.precipitationMm ?? 0} mm`} 
              subValue="Last Hour" 
              icon={<CloudRain className="w-5 h-5 text-blue-400" />} 
            />
            <MetricCard 
              label="Cloud Cover" 
              value={`${current.cloudiness ?? 0}%`} 
              subValue={
                current.cloudiness > 80 ? 'Overcast' : 
                current.cloudiness > 30 ? 'Partly Cloudy' : 'Clear Sky'
              } 
              icon={<Cloud className="w-5 h-5 text-blue-400" />} 
            />
            
            <MetricCard 
              label="Dew Point" 
              value={`${current.dewpointTemperature != null ? current.dewpointTemperature : '--'}°C`} 
              subValue={
                (current.temperatureC - current.dewpointTemperature) <= 2 
                  ? 'High Fog/Mist Risk' 
                  : 'Comfortable'
              } 
              icon={<CloudFog className="w-5 h-5 text-blue-400" />} 
            />
          </section>
        )}

      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon }) {
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 hover:bg-slate-900/50 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">{label}</span>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100 tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{subValue}</p>
      </div>
    </div>
  );
}