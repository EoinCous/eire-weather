import { useWeather } from '../context/WeatherContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import WeatherChart from '../components/WeatherChart';
import DailyForecast from '../components/DailyForecast';
import CurrentConditions from '../components/CurrentConditions';
import WeatherWarnings from '../components/WeatherWarnings';
import SunMoonInfo from '../components/SunMoonInfo';
import PrecipitationRadarPreview from '../components/PrecipitationRadarPreview';
import WeatherHeader from '../components/WeatherHeader';

export default function WeatherDashboard() {
  const { weather, loading, error, requestLocation } = useWeather();
  const navigate = useNavigate();

  const { current, hourlyForecasts } = weather ?? {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Always rendered, so the user can search even when loading or after an error */}
      <WeatherHeader />

      {loading ? (
        <div role="status" className="flex flex-col items-center gap-4 py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="animate-pulse text-sm font-medium text-slate-400">Fetching forecast…</p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-red-500/50 bg-red-950/40 p-6 text-center"
        >
          <AlertCircle className="mb-3 h-12 w-12 text-red-500" />
          <p className="mb-1 font-semibold text-red-400">Couldn’t load the forecast</p>
          <p className="mb-4 text-sm text-slate-400">{error}</p>
          <button
            type="button"
            onClick={() => requestLocation()}
            className="rounded-xl border border-red-500/30 bg-red-900/50 px-4 py-2 text-xs font-medium text-red-200 transition-colors hover:bg-red-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300"
          >
            Use my current location
          </button>
        </div>
      ) : weather ? (
        <>
          <WeatherWarnings />

          <CurrentConditions current={current} />

          <PrecipitationRadarPreview onClick={() => navigate('/precipitation-radar')} />

          {/* 24h rainfall and temperature */}
          {hourlyForecasts && <WeatherChart hourlyForecasts={hourlyForecasts} />}

          <SunMoonInfo />

          {/* 10-day forecast */}
          {hourlyForecasts && <DailyForecast hourlyForecasts={hourlyForecasts} />}
        </>
      ) : null}
    </div>
  );
}