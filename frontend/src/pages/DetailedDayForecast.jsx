import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudRain,
  Droplet,
  Gauge,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Sun,
  Wind,
} from 'lucide-react';

import { WeatherIcon } from '../components/WeatherIcon';
import SunMoonInfo from '../components/SunMoonInfo';
import { useWeather } from '../context/WeatherContext';

const TIME_ZONE = 'Europe/Dublin';
const WET_THRESHOLD_MM = 0.1; // below this counts as dry
const MIN_RAIN_SCALE_MM = 2; // fixed floor so drizzle never looks like a downpour

/* ---------- time helpers (always Irish time, whatever the viewer's device says) ---------- */

// en-CA formats as YYYY-MM-DD, a handy sortable day key
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  hourCycle: 'h23',
});

const timeFormatter = new Intl.DateTimeFormat('en-IE', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dayKeyOf = (timestamp) => dayKeyFormatter.format(new Date(timestamp));
const hourOf = (timestamp) => Number(hourFormatter.format(new Date(timestamp)));
const formatTime = (timestamp) => timeFormatter.format(new Date(timestamp));

// A day key is already an Irish calendar date, so noon UTC is safely the same day anywhere
function shortDayLabel(dayKey) {
  return new Date(`${dayKey}T12:00:00Z`).toLocaleDateString('en-IE', { weekday: 'short', timeZone: 'UTC' });
}

/* ---------- value helpers ---------- */

// Number(null) is 0, so null has to be ruled out BEFORE converting
function toNumber(value) {
  return value != null && !Number.isNaN(Number(value)) ? Number(value) : null;
}

function formatValue(value, suffix = '', digits = 0) {
  if (value == null) return '—';
  const factor = 10 ** digits;
  return `${Math.round(value * factor) / factor}${suffix}`;
}

// "LightRainSun" / "light_rain" -> "light rain sun"
function humanise(symbol) {
  return symbol ? String(symbol).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase() : '';
}

const toKmh = (mps) => Math.round(mps * 3.6);

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
  if (speedMps == null) return 'Unavailable';
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
  if (temperature == null || dewPoint == null) return null;
  const spread = temperature - dewPoint;
  if (spread <= 2) return 'Mist or fog possible';
  if (spread <= 4) return 'Mist possible';
  return null;
}

/* ---------- data shaping ---------- */

function toRow(item) {
  const temp = toNumber(item.temperatureC);
  const dew = toNumber(item.dewpointTemperature);

  return {
    key: item.timestamp,
    timestamp: item.timestamp,
    hour: hourOf(item.timestamp),
    time: formatTime(item.timestamp),
    symbol: item.weatherSymbol,
    temp,
    rain: toNumber(item.precipitationMm),
    rainProbability: toNumber(item.precipitationProbability),
    wind: toNumber(item.windSpeedMps),
    windDirection: item.windDirection || null,
    uv: toNumber(item.uvIndex),
    airQuality: toNumber(item.airQuality),
    humidity: toNumber(item.humidityPercent),
    cloud: toNumber(item.cloudiness),
    dew,
    pressure: toNumber(item.pressureHpa),
    fog: getFogRisk(temp, dew),
  };
}

// Peak and average of one field, ignoring hours where it's missing
function aggregate(rows, field) {
  const valid = rows.filter((r) => r[field] != null);
  if (valid.length === 0) return null;

  const peak = valid.reduce((best, r) => (r[field] > best[field] ? r : best));
  const avg = valid.reduce((sum, r) => sum + r[field], 0) / valid.length;

  return { max: peak[field], peak, avg };
}

// One sentence for the whole day, same idea as the 24-hour chart on the dashboard
function describeRain(rows, isToday) {
  const wetIdx = rows.reduce((acc, r, i) => (r.rain != null && r.rain >= WET_THRESHOLD_MM ? [...acc, i] : acc), []);

  if (wetIdx.length === 0) return isToday ? 'Dry for the rest of the day' : 'Dry all day';
  if (wetIdx.length >= rows.length * 0.8) return 'Rain most of the day';

  const first = rows[wetIdx[0]];
  const lastIdx = wetIdx[wetIdx.length - 1];
  const isOneSpell = lastIdx - wetIdx[0] + 1 === wetIdx.length;

  if (isOneSpell) {
    const end = rows[lastIdx + 1]?.time ?? 'midnight';
    return `Rain from ${first.time} to ${end}`;
  }

  return `Rain on and off from ${first.time}`;
}

const DAY_PARTS = [
  { key: 'night', label: 'Night', from: 0, to: 6 },
  { key: 'morning', label: 'Morning', from: 6, to: 12 },
  { key: 'afternoon', label: 'Afternoon', from: 12, to: 18 },
  { key: 'evening', label: 'Evening', from: 18, to: 24 },
];

const pad = (n) => String(n % 24).padStart(2, '0');

function buildParts(rows) {
  return DAY_PARTS.map((part) => {
    const hours = rows.filter((r) => r.hour >= part.from && r.hour < part.to);
    if (hours.length === 0) return null; // e.g. the morning has already passed today

    const temps = hours.map((h) => h.temp).filter((t) => t != null);
    const winds = hours.map((h) => h.wind).filter((w) => w != null);

    return {
      ...part,
      range: `${pad(part.from)}:00–${pad(part.to)}:00`,
      avgTemp: temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null,
      rain: hours.reduce((sum, h) => sum + (h.rain ?? 0), 0),
      maxWind: winds.length ? Math.max(...winds) : null,
      symbol: hours[Math.floor(hours.length / 2)].symbol,
    };
  }).filter(Boolean);
}

/* ---------- small presentational pieces ---------- */

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-4xl">{children}</div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
    >
      <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
      Dashboard
    </Link>
  );
}

function DayLink({ dayKey, direction }) {
  const isPrev = direction === 'prev';
  const Icon = isPrev ? ChevronLeft : ChevronRight;

  const content = (
    <>
      {isPrev && <Icon className="h-4 w-4" />}
      <span>{dayKey ? shortDayLabel(dayKey) : isPrev ? 'Prev' : 'Next'}</span>
      {!isPrev && <Icon className="h-4 w-4" />}
    </>
  );

  const base = 'inline-flex h-10 items-center gap-1 rounded-xl border px-3 text-sm font-medium';

  if (!dayKey) {
    return (
      <span aria-disabled="true" className={`${base} border-slate-800/60 text-slate-700`}>
        {content}
      </span>
    );
  }

  return (
    <Link
      to={`/day/${dayKey}`}
      replace
      aria-label={`${isPrev ? 'Previous' : 'Next'} day, ${shortDayLabel(dayKey)}`}
      className={`${base} border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400`}
    >
      {content}
    </Link>
  );
}

function StatCard({ icon: Icon, iconClass, label, value, sub, subClass = 'text-slate-500' }) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${subClass}`}>{sub}</p>}
    </div>
  );
}

function DetailTile({ label, value, sub, subClass = 'text-slate-400' }) {
  return (
    <div className="rounded-xl bg-slate-900/60 p-3">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="mt-0.5">
        <span className="text-base font-semibold text-slate-100 tabular-nums">{value}</span>
        {sub && <span className={`mt-0.5 block text-[11px] ${subClass}`}>{sub}</span>}
      </dd>
    </div>
  );
}

/*
 * One hour. Collapsed it is a single compact line (time, weather, temp, rain, wind);
 * tapping it opens the rest of the metrics. The same markup serves mobile and desktop.
 */
function HourRow({ row, index, isOpen, onToggle, rainScale }) {
  const isWet = row.rain != null && row.rain >= WET_THRESHOLD_MM;
  const rainWidth = isWet ? Math.max(Math.min(row.rain / rainScale, 1), 0.06) * 100 : 0;
  const panelId = `hour-detail-${index}`;

  const uvInfo = getUvDescription(row.uv);
  const aqInfo = getAirQualityDescription(row.airQuality);

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="grid w-full grid-cols-[3rem_1.75rem_2.25rem_minmax(0,1fr)_4.5rem_1rem] items-center gap-x-2 px-3 py-3 text-left transition-colors hover:bg-slate-800/25 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400 sm:grid-cols-[4rem_2rem_3rem_minmax(0,1fr)_6rem_1.25rem] sm:gap-x-4 sm:px-5"
      >
        <span className="text-sm font-semibold text-slate-200 tabular-nums">{row.time}</span>

        <span className="text-blue-300">
          <WeatherIcon symbol={row.symbol} className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="sr-only">{humanise(row.symbol)}</span>
        </span>

        <span className="text-lg font-semibold text-white tabular-nums">
          {row.temp != null ? `${Math.round(row.temp)}°` : '—'}
        </span>

        {/* Rain: amount plus a bar, so a column of rows reads as a timeline */}
        <span className="min-w-0">
          <span className={`block text-xs tabular-nums ${isWet ? 'font-medium text-cyan-400' : 'text-slate-600'}`}>
            {isWet ? `${row.rain.toFixed(1)} mm` : 'Dry'}
          </span>
          {isWet && row.rainProbability != null && (
            <span className="mt-0.5 block text-[11px] text-cyan-200/70 tabular-nums">
              {Math.round(row.rainProbability)}% chance
            </span>
          )}
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-800/80">
            <span className="block h-full rounded-full bg-cyan-400/80" style={{ width: `${rainWidth}%` }} />
          </span>
        </span>

        <span className="text-right">
          <span className="block text-xs font-medium text-slate-300 tabular-nums">
            {row.wind != null ? `${toKmh(row.wind)} km/h` : '—'}
          </span>
          {row.windDirection && <span className="block text-[11px] text-slate-500">{row.windDirection}</span>}
        </span>

        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div id={panelId} hidden={!isOpen} className="border-t border-slate-800/40 bg-slate-950/30 px-3 py-4 sm:px-5">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <DetailTile label="Humidity" value={formatValue(row.humidity, '%')} />
          <DetailTile label="Cloud cover" value={formatValue(row.cloud, '%')} sub={getCloudDescription(row.cloud)} />
          <DetailTile
            label="Dew point"
            value={formatValue(row.dew, '°C', 1)}
            sub={row.fog}
            subClass={row.fog ? 'text-amber-400' : 'text-slate-400'}
          />
          <DetailTile label="Pressure" value={formatValue(row.pressure, ' hPa')} />
          <DetailTile label="UV index" value={formatValue(row.uv, '', 1)} sub={uvInfo.label} subClass={uvInfo.color} />
          <DetailTile
            label="Air quality"
            value={formatValue(row.airQuality)}
            sub={aqInfo.label}
            subClass={aqInfo.color}
          />
        </dl>
      </div>
    </li>
  );
}

/* ---------- page ---------- */

export default function DetailedDayForecast() {
  // The route param is "/day/:dateKey" in my version; rename if yours differs
  const params = useParams();
  const dateKey = params.dateKey ?? params.date;

  const { weather, loading, error, locationName, fetchAiSummary } = useWeather();
  const hourlyForecasts = weather?.hourlyForecasts;

  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [openHours, setOpenHours] = useState(() => new Set());

  // Moving to another day (prev/next) reuses this component, so reset per-day state
  useEffect(() => {
    window.scrollTo(0, 0);
    setAiSummary(null);
    setAiError(null);
    setOpenHours(new Set());
  }, [dateKey]);

  // Everything comes from the shared forecast and the URL, so refreshes and
  // shared links work. No router state is needed.
  const { dayKeys, rows } = useMemo(() => {
    if (!hourlyForecasts?.length) return { dayKeys: [], rows: [] };

    const keys = new Set();
    const dayRows = [];

    hourlyForecasts.forEach((item) => {
      const key = dayKeyOf(item.timestamp);
      keys.add(key);
      if (key === dateKey) dayRows.push(toRow(item));
    });

    return { dayKeys: [...keys].slice(0, 10), rows: dayRows };
  }, [hourlyForecasts, dateKey]);

  const summary = useMemo(() => {
    if (rows.length === 0) return null;

    const isToday = dateKey === dayKeyOf(Date.now());
    const temps = rows.map((r) => r.temp).filter((t) => t != null);
    const midday = rows.reduce((best, r) => (Math.abs(r.hour - 13) < Math.abs(best.hour - 13) ? r : best));
    const date = new Date(rows[0].timestamp);
    const rain = aggregate(rows, 'rain');

    return {
      isToday,
      dayName: date.toLocaleDateString('en-IE', { weekday: 'long', timeZone: TIME_ZONE }),
      dateStr: date.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', timeZone: TIME_ZONE }),
      headline: describeRain(rows, isToday),
      minTemp: temps.length ? Math.round(Math.min(...temps)) : null,
      maxTemp: temps.length ? Math.round(Math.max(...temps)) : null,
      symbol: midday.symbol || 'cloud',
      totalRain: rows.reduce((sum, r) => sum + (r.rain ?? 0), 0),
      maxRain: rain?.max ?? 0,
      rainPeak: rain && rain.max >= WET_THRESHOLD_MM ? rain.peak : null,
      wind: aggregate(rows, 'wind'),
      uv: aggregate(rows, 'uv'),
      airQuality: aggregate(rows, 'airQuality'),
      humidity: aggregate(rows, 'humidity'),
      cloud: aggregate(rows, 'cloud'),
      pressure: aggregate(rows, 'pressure'),
      parts: buildParts(rows),
    };
  }, [rows, dateKey]);

  const handleFetchAiSummary = async () => {
    if (!dateKey) return;

    setLoadingAi(true);
    setAiError(null);

    try {
      setAiSummary(await fetchAiSummary('SINGLE_DAY', dateKey));
    } catch (err) {
      setAiError(err.message || 'Could not generate the day summary. Try again.');
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleHour = (key) =>
    setOpenHours((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allOpen = rows.length > 0 && openHours.size === rows.length;
  const toggleAll = () => setOpenHours(allOpen ? new Set() : new Set(rows.map((r) => r.key)));

  /* ----- states with nothing to show ----- */

  if (!weather) {
    return (
      <PageShell>
        <BackLink />
        {loading ? (
          <div role="status" className="flex flex-col items-center gap-4 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="animate-pulse text-sm font-medium text-slate-400">Fetching forecast…</p>
          </div>
        ) : (
          <p role="alert" className="py-24 text-center text-slate-400">
            {error || 'The forecast isn’t available right now.'}
          </p>
        )}
      </PageShell>
    );
  }

  if (!summary) {
    return (
      <PageShell>
        <BackLink />
        <div className="py-24 text-center">
          <p className="text-slate-400">There’s no forecast for this date.</p>
          <Link to="/" className="mt-3 inline-block text-blue-400 hover:text-blue-300 hover:underline">
            Return to dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  const dayIndex = dayKeys.indexOf(dateKey);
  const prevKey = dayIndex > 0 ? dayKeys[dayIndex - 1] : null;
  const nextKey = dayIndex >= 0 && dayIndex < dayKeys.length - 1 ? dayKeys[dayIndex + 1] : null;

  const rainScale = Math.max(summary.maxRain, MIN_RAIN_SCALE_MM);
  const windInfo = summary.wind;
  const uvInfo = getUvDescription(summary.uv?.max ?? null);
  const aqInfo = getAirQualityDescription(summary.airQuality?.max ?? null);

  return (
    <PageShell>
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackLink />

        <nav aria-label="Change day" className="flex items-center gap-2">
          <DayLink dayKey={prevKey} direction="prev" />
          <DayLink dayKey={nextKey} direction="next" />
        </nav>
      </div>

      {/* Hero */}
      <section className="relative mb-5 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-slate-950/60 p-6 shadow-2xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* The day page has no header, so say which place this is for */}
            <p className="flex items-center gap-1.5 text-sm text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-hidden="true" />
              <span className="truncate">{locationName}</span>
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              {summary.isToday ? 'Today' : summary.dayName}
            </h1>

            <p className="mt-1 text-sm text-slate-400 sm:text-base">
              {summary.isToday ? `${summary.dayName}, ${summary.dateStr}` : summary.dateStr}
            </p>

            <p className="mt-4 text-lg font-medium text-slate-100">{summary.headline}</p>

            <div className="mt-3 flex items-baseline gap-5">
              <p>
                <span className="mr-1.5 text-xs text-slate-500">High</span>
                <span className="text-3xl font-semibold text-white tabular-nums sm:text-4xl">
                  {summary.maxTemp != null ? `${summary.maxTemp}°` : '—'}
                </span>
              </p>
              <p>
                <span className="mr-1.5 text-xs text-slate-500">Low</span>
                <span className="text-xl font-semibold text-slate-400 tabular-nums sm:text-2xl">
                  {summary.minTemp != null ? `${summary.minTemp}°` : '—'}
                </span>
              </p>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center justify-center">
            <div className="absolute h-28 w-28 rounded-full bg-blue-500/[0.10] blur-2xl md:h-44 md:w-44 md:blur-3xl" />
            <div className="relative text-blue-300 drop-shadow-[0_0_20px_rgba(96,165,250,0.25)]">
              <WeatherIcon
                symbol={summary.symbol}
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-32 md:w-32"
                strokeWidth={1.25}
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI summary */}
      <div className="mb-6" aria-live="polite">
        {aiSummary ? (
          <div className="rounded-2xl border border-blue-500/20 bg-slate-900/40 p-4 shadow-xl md:p-5">
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

      {/* Through the day */}
      {summary.parts.length > 0 && (
        <section aria-label="Through the day" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.parts.map((part) => {
            const wet = part.rain >= WET_THRESHOLD_MM;

            return (
              <div key={part.key} className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                <p className="text-xs font-medium text-slate-300">{part.label}</p>
                <p className="text-[11px] text-slate-600">{part.range}</p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-2xl font-semibold text-white tabular-nums">
                    {part.avgTemp != null ? `${part.avgTemp}°` : '—'}
                  </span>
                  <span className="text-blue-300">
                    <WeatherIcon symbol={part.symbol} className="h-8 w-8" />
                    <span className="sr-only">{humanise(part.symbol)}</span>
                  </span>
                </div>

                <p className={`mt-3 text-xs tabular-nums ${wet ? 'font-medium text-cyan-400' : 'text-slate-500'}`}>
                  {wet ? `${part.rain.toFixed(1)} mm rain` : 'Dry'}
                </p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {part.maxWind != null ? `Wind up to ${toKmh(part.maxWind)} km/h` : 'Wind unavailable'}
                </p>
              </div>
            );
          })}
        </section>
      )}

      {/* Day summary */}
      <section aria-label="Day summary" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CloudRain}
          iconClass="text-cyan-400"
          label="Rain"
          value={summary.totalRain >= WET_THRESHOLD_MM ? `${formatValue(summary.totalRain, ' mm', 1)}` : 'None'}
          sub={summary.rainPeak ? `Heaviest around ${summary.rainPeak.time}` : 'Total for the day'}
        />

        <StatCard
          icon={Wind}
          iconClass="text-blue-400"
          label="Peak wind"
          value={windInfo ? `${toKmh(windInfo.max)} km/h` : '—'}
          sub={windInfo ? `${getWindDescription(windInfo.max)} around ${windInfo.peak.time}` : null}
        />

        <StatCard
          icon={Sun}
          iconClass={uvInfo.color}
          label="Peak UV"
          value={formatValue(summary.uv?.max ?? null, '', 1)}
          sub={uvInfo.label}
          subClass={uvInfo.color}
        />

        <StatCard
          icon={Activity}
          iconClass={aqInfo.color}
          label="Air quality"
          value={formatValue(summary.airQuality?.max ?? null)}
          sub={aqInfo.label ? `${aqInfo.label} at worst` : null}
          subClass={aqInfo.color}
        />

        {/* Averages */}
        <div className="col-span-2 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 lg:col-span-4">
          <p className="text-xs font-medium text-slate-400">Daily averages</p>

          <dl className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <dt className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Droplet className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                Humidity
              </dt>
              <dd className="mt-0.5 text-base font-semibold text-slate-100 tabular-nums">
                {formatValue(summary.humidity?.avg ?? null, '%')}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Cloud className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                Cloud cover
              </dt>
              <dd className="mt-0.5 text-base font-semibold text-slate-100 tabular-nums">
                {formatValue(summary.cloud?.avg ?? null, '%')}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Gauge className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                Pressure
              </dt>
              <dd className="mt-0.5 text-base font-semibold text-slate-100 tabular-nums">
                {formatValue(summary.pressure?.avg ?? null, ' hPa')}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Sun and moon */}
      <div className="mb-6">
        <SunMoonInfo date={dateKey} />
      </div>

      {/* Hour by hour */}
      <section aria-labelledby="hourly-heading">
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <h2 id="hourly-heading" className="text-base font-semibold text-white">
              Hour by hour
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Tap an hour for humidity, pressure, UV and more</p>
          </div>

          <button
            type="button"
            onClick={toggleAll}
            className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/30 shadow-xl">
          <ul className="divide-y divide-slate-800/60">
            {rows.map((row, index) => (
              <HourRow
                key={row.key}
                row={row}
                index={index}
                isOpen={openHours.has(row.key)}
                onToggle={() => toggleHour(row.key)}
                rainScale={rainScale}
              />
            ))}
          </ul>
        </div>
      </section>

      <div className="h-8" />
    </PageShell>
  );
}