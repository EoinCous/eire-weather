import { useWeather } from '../hooks/useWeather';
import { 
  MapPin, Loader2, AlertCircle
} from 'lucide-react';
import WeatherChart from '../components/WeatherChart';
import DailyForecast from '../components/DailyForecast';
import CurrentConditions from '../components/CurrentConditions';
import { WeatherIcon } from '../components/WeatherIcon';
import WeatherWarnings from '../components/WeatherWarnings';
import SunMoonInfo from '../components/SunMoonInfo';
import { SearchBar } from '../components/SearchBar';

export default function WeatherDashboard() {
  const { coords, weather, locationName, loading, error, searchLocation, requestLocation } = useWeather();

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
        <SearchBar searchLocation={searchLocation} requestLocation={requestLocation} />
      </header>

      <WeatherWarnings />

      <CurrentConditions current={current} />

      <SunMoonInfo lat={coords.lat} lon={coords.lon} />

      {/* 24h Rainfall & Temperature */}
      {hourlyForecasts && <WeatherChart hourlyForecasts={hourlyForecasts} />}

      {/* 10-day forecast */}
      {hourlyForecasts && (
        <DailyForecast hourlyForecasts={hourlyForecasts} WeatherIcon={WeatherIcon} />
      )}
    </div>
  );
}