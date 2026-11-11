import { useState } from 'react';
import { Wind, CloudRain, Sparkles, Loader2, RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';

import { WeatherIcon } from './WeatherIcon';
import { useWeather } from '../context/WeatherContext';

/* ---------- helpers ---------- */

function toNumber(value) {
  return value != null && !Number.isNaN(Number(value)) ? Number(value) : null;
}

function formatValue(value, suffix = '', digits = 0) {
  if (value == null) return '—';
  const formattedValue = Number.isNaN(Number(value))
    ? value
    : Number(value).toFixed(digits);
  return `${formattedValue}${suffix}`;
}

// "LightRainSun" / "light_rain" -> "light rain sun"
function humanise(symbol) {
  return String(symbol)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();
}

// Apparent temperature (Australian Bureau of Meteorology formula).
// Works across the whole range, unlike wind chill, which only applies when cold.
function getFeelsLike(temp, windMps, humidity) {
  if (temp == null || windMps == null || humidity == null) return null;
  const vapourPressure = (humidity / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
  return Math.round((temp + 0.33 * vapourPressure - 0.7 * windMps - 4) * 10) / 10;
}

// Beaufort scale, upper limit of each force in m/s
const BEAUFORT = [
  [0.5, 'Calm'],
  [1.6, 'Light air'],
  [3.4, 'Light breeze'],
  [5.5, 'Gentle breeze'],
  [8.0, 'Moderate breeze'],
  [10.8, 'Fresh breeze'],
  [13.9, 'Strong breeze'],
  [17.2, 'Near gale'],
  [20.8, 'Gale'],
  [24.5, 'Strong gale'],
  [28.5, 'Storm'],
  [32.7, 'Violent storm'],
];

function getWindDescription(speedMps) {
  if (speedMps == null) return 'Wind unavailable';
  const match = BEAUFORT.find(([limit]) => speedMps < limit);
  return match ? match[1] : 'Hurricane force';
}

function getCloudDescription(cloudiness) {
  if (cloudiness == null) return null;
  if (cloudiness >= 80) return 'Overcast';
  if (cloudiness >= 50) return 'Mostly cloudy';
  if (cloudiness >= 20) return 'Partly cloudy';
  return 'Clear sky';
}

function getUvDescription(uv) {
  if (uv == null) return { label: null, color: 'text-slate-500' };
  if (uv < 3) return { label: 'Low', color: 'text-emerald-400' };
  if (uv < 6) return { label: 'Moderate', color: 'text-yellow-400' };
  if (uv < 8) return { label: 'High', color: 'text-orange-400' };
  if (uv < 11) return { label: 'Very high', color: 'text-red-400' };
  return { label: 'Extreme', color: 'text-purple-400' };
}

// European Air Quality Index bands. The scale is open-ended, so no "/ 100".
function getAirQualityDescription(aqi) {
  if (aqi == null) return { label: null, color: 'text-slate-500' };
  if (aqi <= 20) return { label: 'Good', color: 'text-emerald-400' };
  if (aqi <= 40) return { label: 'Fair', color: 'text-sky-400' };
  if (aqi <= 60) return { label: 'Moderate', color: 'text-amber-400' };
  if (aqi <= 80) return { label: 'Poor', color: 'text-orange-400' };
  return { label: 'Very poor', color: 'text-red-400' };
}

function getFogRisk(temperature, dewPoint) {
  if (temperature == null || dewPoint == null) return { label: null, color: 'text-slate-500', likely: false };

  const spread = temperature - dewPoint;
  if (spread <= 2) return { label: 'Mist or fog possible', color: 'text-amber-400', likely: true };
  if (spread <= 4) return { label: 'Mist possible', color: 'text-yellow-400', likely: false };
  return { label: 'Low fog risk', color: 'text-slate-400', likely: false };
}

/* ---------- small presentational pieces ---------- */

function PrimaryStat({ icon: Icon, iconClass, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white tabular-nums">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}

function DetailTile({ label, value, sub, subClass = 'text-slate-400' }) {
  return (
    <div className="rounded-xl bg-slate-950/40 p-3">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="mt-0.5">
        <span className="text-base font-semibold text-slate-100 tabular-nums">{value}</span>
        {sub && <span className={`mt-0.5 block text-[11px] ${subClass}`}>{sub}</span>}
      </dd>
    </div>
  );
}

/* ---------- component ---------- */

export default function CurrentConditions({ current }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { fetchAiSummary } = useWeather();

  if (!current) return null;

  const handleFetchAiSummary = async () => {
    setLoadingAi(true);
    setAiError(null);

    try {
      setAiSummary(await fetchAiSummary('CURRENT'));
    } catch (err) {
      setAiError(err.message || 'Could not generate the summary. Try again.');
    } finally {
      setLoadingAi(false);
    }
  };

  const temperature = toNumber(current.temperatureC);
  const dewPoint = toNumber(current.dewpointTemperature);
  const windSpeed = toNumber(current.windSpeedMps);
  const humidity = toNumber(current.humidityPercent);
  const pressure = toNumber(current.pressureHpa);
  const rainfall = toNumber(current.precipitationMm);
  const rainfallMin = toNumber(current.precipitationMinMm);
  const rainfallMax = toNumber(current.precipitationMaxMm);
  const rainfallProbability = toNumber(current.precipitationProbability);
  const cloudiness = toNumber(current.cloudiness);
  const uvIndex = toNumber(current.uvIndex);
  const airQuality = toNumber(current.airQuality);

  const feelsLike = getFeelsLike(temperature, windSpeed, humidity);
  const showFeelsLike = feelsLike != null && temperature != null && Math.abs(feelsLike - temperature) >= 1;

  const windKmh = windSpeed != null ? Math.round(windSpeed * 3.6) : null;
  const windDescription = getWindDescription(windSpeed);
  const windDetail = current.windDirection ? `${windDescription}, ${current.windDirection}` : windDescription;

  const fogRisk = getFogRisk(temperature, dewPoint);
  const uvInfo = getUvDescription(uvIndex);
  const aqInfo = getAirQualityDescription(airQuality);
  const cloudDescription = getCloudDescription(cloudiness);

  const weatherDescription =
    current.weatherDescription ||
    (current.weatherSymbol ? humanise(current.weatherSymbol) : 'Current conditions');

  const rainfallDetails = ['This hour'];
  if (rainfall == null || rainfall >= 0.1 || rainfallProbability > 0) {
    if (rainfallMin != null && rainfallMax != null) {
      rainfallDetails.push(`range ${formatValue(rainfallMin, '', 1)}–${formatValue(rainfallMax, ' mm', 1)}`);
    } else if (rainfallMin != null) {
      rainfallDetails.push(`from ${formatValue(rainfallMin, ' mm', 1)}`);
    } else if (rainfallMax != null) {
      rainfallDetails.push(`up to ${formatValue(rainfallMax, ' mm', 1)}`);
    }
    if (rainfallProbability != null) {
      rainfallDetails.push(`${formatValue(rainfallProbability, '%')} chance`);
    }
  }

  // Contextual heads-ups: only shown when there is something worth knowing
  const alerts = [];
  if (fogRisk.likely) {
    alerts.push({ key: 'fog', text: 'Mist or fog possible', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' });
  }
  if (uvIndex != null && uvIndex >= 3) {
    alerts.push({ key: 'uv', text: `UV ${uvInfo.label.toLowerCase()}`, className: 'border-orange-500/30 bg-orange-500/10 text-orange-300' });
  }
  if (airQuality != null && airQuality > 60) {
    alerts.push({ key: 'air', text: `Air quality ${aqInfo.label.toLowerCase()}`, className: 'border-red-500/30 bg-red-500/10 text-red-300' });
  }

  return (
    <section
      aria-label="Current conditions"
      className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-7"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-sky-500/[0.06] blur-3xl" />

      {/* Hero */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mt-1 flex items-start">
            <span className="text-7xl font-semibold tracking-tighter text-white tabular-nums md:text-8xl">
              {temperature != null ? temperature : '—'}
            </span>
            {temperature != null && (
              <span className="ml-1 mt-2 text-2xl font-medium text-slate-400 md:mt-3 md:text-3xl">°C</span>
            )}
          </div>

          <p className="mt-1 text-lg font-medium text-slate-100 first-letter:uppercase md:text-xl">
            {weatherDescription}
          </p>

          {showFeelsLike && <p className="mt-0.5 text-sm text-slate-400">Feels like {feelsLike}°</p>}
        </div>

        <div className="relative flex shrink-0 items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-blue-500/[0.10] blur-2xl md:h-48 md:w-48 md:blur-3xl" />
          <div className="relative text-blue-300 drop-shadow-[0_0_20px_rgba(96,165,250,0.25)]">
            <WeatherIcon
              symbol={current.weatherSymbol}
              className="h-20 w-20 sm:h-24 sm:w-24 md:h-36 md:w-36"
              strokeWidth={1.25}
            />
          </div>
        </div>
      </div>

      {/* Heads-ups */}
      {alerts.length > 0 && (
        <ul className="relative z-10 mt-4 flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <li key={alert.key} className={`rounded-full border px-3 py-1 text-xs font-medium ${alert.className}`}>
              {alert.text}
            </li>
          ))}
        </ul>
      )}

      {/* The two numbers people check most */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
        <PrimaryStat
          icon={Wind}
          iconClass="text-blue-400"
          label="Wind"
          value={windKmh != null ? `${windKmh} km/h` : '—'}
          detail={windDetail}
        />
        <PrimaryStat
          icon={CloudRain}
          iconClass="text-cyan-400"
          label="Rain"
          value={rainfall == null ? '—' : rainfall >= 0.1 ? `${formatValue(rainfall, ' mm', 1)}` : 'None'}
          detail={rainfallDetails.join(' · ')}
        />
      </div>

      {/* Secondary metrics: collapsed on mobile, always visible from md up */}
      <button
        type="button"
        onClick={() => setShowDetails((open) => !open)}
        aria-expanded={showDetails}
        className="relative z-10 mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 md:hidden"
      >
        {showDetails ? 'Hide details' : 'More details'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      <dl
        className={`relative z-10 mt-3 grid-cols-2 gap-3 md:mt-4 md:grid md:grid-cols-3 ${
          showDetails ? 'grid' : 'hidden'
        }`}
      >
        <DetailTile label="Humidity" value={formatValue(humidity, '%')} />
        <DetailTile
          label="Dew point"
          value={formatValue(dewPoint, '°C', 1)}
          sub={fogRisk.label}
          subClass={fogRisk.color}
        />
        <DetailTile label="Pressure" value={formatValue(pressure, ' hPa')} />
        <DetailTile label="Cloud cover" value={formatValue(cloudiness, '%')} sub={cloudDescription} />
        <DetailTile label="UV index" value={formatValue(uvIndex, '', 1)} sub={uvInfo.label} subClass={uvInfo.color} />
        <DetailTile label="Air quality" value={formatValue(airQuality)} sub={aqInfo.label} subClass={aqInfo.color} />
      </dl>

      {/* AI summary */}
      <div className="relative z-10 mt-6" aria-live="polite">
        {aiSummary ? (
          <div className="rounded-2xl border border-blue-500/20 bg-slate-950/60 p-4 md:p-5">
            <p className="max-w-prose text-sm leading-relaxed text-slate-200">{aiSummary}</p>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Sparkles className="h-3 w-3 text-blue-400" />
                Written by AI from the forecast data
              </p>

              <button
                type="button"
                onClick={handleFetchAiSummary}
                disabled={loadingAi}
                aria-label="Regenerate AI summary"
                title="Regenerate AI summary"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleFetchAiSummary}
              disabled={loadingAi}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/20 px-5 py-2.5 text-xs font-semibold text-blue-200 transition-colors hover:border-blue-400 hover:bg-blue-600/30 hover:text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              {loadingAi ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                  <span>Writing summary…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span>Get AI summary</span>
                </>
              )}
            </button>
          </div>
        )}

        {aiError && (
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}
      </div>
    </section>
  );
}