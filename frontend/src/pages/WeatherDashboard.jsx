import { useState } from 'react';
import { useWeather } from '../hooks/useWeather';
import { 
  Droplet, MapPin, Loader2, AlertCircle, Search
} from 'lucide-react';
import WeatherChart from '../components/WeatherChart';
import DailyForecast from '../components/DailyForecast';
import CurrentConditions from '../components/CurrentConditions';
import { WeatherIcon } from '../components/WeatherIcon';
import WeatherWarning from '../components/WeatherWarning';

export default function WeatherDashboard() {
  const { weather, locationName, loading, error, requestLocation, searchLocation } = useWeather();
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchLocation(searchInput);
      setSearchInput('');
    }
  };

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
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button 
            onClick={() => requestLocation()}
            className="px-4 py-2 text-xs font-medium bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-xl border border-red-500/30 transition-colors"
          >
            Reset to Current Location
          </button>
        </div>
      </div>
    );
  }

  const { current, hourlyForecasts } = weather;

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 md:px-6 shadow-lg">
          
          {/* Logo & Location */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                ÉireWeather
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-sm font-medium">{locationName}</span>
              </div>
            </div>
          </div>

          {/* Search Bar & Location Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search city or town..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <button 
              onClick={() => requestLocation()}
              title="Use Current Location"
              className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors text-white rounded-xl shadow-md flex-shrink-0"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden md:inline ml-2">Current Location</span>
            </button>
          </div>
        </header>

        <WeatherWarning />

        <CurrentConditions current={current} />

        {/* 24h Rainfall & Temperature */}
        {hourlyForecasts && <WeatherChart hourlyData={hourlyForecasts} />}

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

        {/* 10-day forecast */}
        {hourlyForecasts && (
          <DailyForecast hourlyForecasts={hourlyForecasts} WeatherIcon={WeatherIcon} />
        )}
      </div>
    </div>
  );
}