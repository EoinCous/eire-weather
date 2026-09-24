import {
  Wind,
  Droplet,
  Gauge,
  CloudRain,
  Cloud,
  CloudFog
} from 'lucide-react';

import { WeatherIcon } from './WeatherIcon';

function formatValue(value, suffix = '') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  return `${value}${suffix}`;
}

function getCloudDescription(cloudiness) {
  if (cloudiness == null) return 'Unknown';

  if (cloudiness >= 80) return 'Overcast';
  if (cloudiness >= 50) return 'Mostly Cloudy';
  if (cloudiness >= 20) return 'Partly Cloudy';

  return 'Clear Sky';
}

function getFogRisk(temperature, dewPoint) {
  if (
    temperature == null ||
    dewPoint == null
  ) {
    return {
      label: 'Unavailable',
      color: 'text-slate-500',
    };
  }

  const spread = temperature - dewPoint;

  if (spread <= 2) {
    return {
      label: 'Possible Mist / Fog',
      color: 'text-amber-400',
    };
  }

  if (spread <= 4) {
    return {
      label: 'Mist Possible',
      color: 'text-yellow-400',
    };
  }

  return {
    label: 'Low Fog Risk',
    color: 'text-slate-400',
  };
}

function getWindDescription(speed) {
  if (speed == null) return 'Wind unavailable';

  if (speed < 1) return 'Calm';
  if (speed < 4) return 'Light Breeze';
  if (speed < 8) return 'Moderate Wind';
  if (speed < 14) return 'Fresh Wind';

  return 'Strong Wind';
}

function MetricCard({
  label,
  value,
  subValue,
  icon: Icon,
  iconClass = 'text-blue-400',
}) {
  return (
    <div className="group rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/60">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>

        <div
          className={`
            flex h-8 w-8 shrink-0 items-center justify-center
            rounded-xl border border-slate-800
            bg-slate-900/80
            ${iconClass}
            transition-all duration-300
            group-hover:border-slate-700
          `}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div>
        <p className="text-xl font-extrabold tracking-tight text-slate-100 md:text-2xl">
          {value}
        </p>

        <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-500">
          {subValue}
        </p>
      </div>
    </div>
  );
}

export default function CurrentConditions({ current }) {
  if (!current) return null;

  const temperature =
    current.temperatureC != null
      ? Number(current.temperatureC)
      : null;

  const dewPoint =
    current.dewpointTemperature != null
      ? Number(current.dewpointTemperature)
      : null;

  const windSpeed =
    current.windSpeedMps != null
      ? Number(current.windSpeedMps)
      : null;

  const humidity =
    current.humidityPercent != null
      ? Number(current.humidityPercent)
      : null;

  const pressure =
    current.pressureHpa != null
      ? Number(current.pressureHpa)
      : null;

  const rainfall =
    current.precipitationMm != null
      ? Number(current.precipitationMm)
      : null;

  const cloudiness =
    current.cloudiness != null
      ? Number(current.cloudiness)
      : null;

  const fogRisk = getFogRisk(
    temperature,
    dewPoint
  );

  const weatherDescription =
    current.weatherDescription ||
    current.weatherSymbol ||
    'Current conditions';

  const windDescription = getWindDescription(
    windSpeed
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-7">

      {/* Ambient background */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-sky-500/[0.06] blur-3xl" />

      {/* HERO */}
      <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

        {/* Temperature / Condition */}
        <div className="min-w-0">

          {/* Status pill */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
              Current Conditions
            </span>
          </div>

          {/* Main temperature */}
          <div className="flex items-start">
            <span className="text-7xl font-black tracking-[-0.06em] text-white md:text-8xl">
              {temperature != null
                ? temperature
                : '—'}
            </span>

            {temperature != null && (
              <span className="ml-2 mt-3 text-3xl font-bold text-blue-400 md:text-4xl">
                °C
              </span>
            )}
          </div>

          {/* Weather description */}
          <p className="mt-2 max-w-md text-lg font-semibold capitalize text-slate-200 md:text-xl">
            {weatherDescription}
          </p>
        </div>

        {/* HERO ICON */}
        <div className="relative flex shrink-0 items-center justify-center self-center lg:self-auto">

          <div className="absolute h-40 w-40 rounded-full bg-blue-500/[0.08] blur-3xl md:h-52 md:w-52" />

          <div className="relative rounded-full border border-slate-800/50 bg-slate-950/20 p-4">
            <div className="rounded-full border border-slate-800/40 bg-slate-900/40 p-5">
              <div className="text-blue-300 drop-shadow-[0_0_30px_rgba(96,165,250,0.25)]">
                <WeatherIcon
                  symbol={current.weatherSymbol}
                  className="h-28 w-28 md:h-36 md:w-36"
                  strokeWidth={1.25}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED METRICS */}
      <div className="relative z-10 mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

        <MetricCard
          label="Wind Speed"
          value={formatValue(windSpeed, ' m/s')}
          subValue={
            current.windDirection
              ? `${current.windDirection} • ${windDescription}`
              : windDescription
          }
          icon={Wind}
          iconClass="text-blue-400"
        />

        <MetricCard
          label="Humidity"
          value={formatValue(humidity, '%')}
          subValue="Relative humidity"
          icon={Droplet}
          iconClass="text-cyan-400"
        />

        <MetricCard
          label="Pressure"
          value={formatValue(pressure, ' hPa')}
          subValue="Atmospheric"
          icon={Gauge}
          iconClass="text-violet-400"
        />

        <MetricCard
          label="Rainfall"
          value={formatValue(rainfall, ' mm')}
          subValue="Past hour"
          icon={CloudRain}
          iconClass="text-sky-400"
        />

        <MetricCard
          label="Cloud Cover"
          value={formatValue(cloudiness, '%')}
          subValue={getCloudDescription(cloudiness)}
          icon={Cloud}
          iconClass="text-slate-300"
        />

        <MetricCard
          label="Dew Point"
          value={formatValue(dewPoint, '°C')}
          subValue={fogRisk.label}
          icon={CloudFog}
          iconClass={
            fogRisk.color.includes('amber')
              ? 'text-amber-400'
              : 'text-slate-400'
          }
        />
      </div>
    </section>
  );
}