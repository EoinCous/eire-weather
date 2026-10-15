import {
  Wind,
  Droplet,
  Thermometer,
  Gauge,
  CloudRain,
  Cloud,
  Sun,
  Activity
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

function getUvDescription(uv) {
  if (uv == null || Number.isNaN(Number(uv))) {
    return { label: 'Unavailable', color: 'text-slate-400', iconColor: 'text-amber-400' };
  }

  const val = Number(uv);

  if (val < 3) {
    return { label: 'Low Risk', color: 'text-emerald-400', iconColor: 'text-emerald-400' };
  }
  if (val < 6) {
    return { label: 'Moderate (SPF 30)', color: 'text-yellow-400', iconColor: 'text-yellow-400' };
  }
  if (val < 8) {
    return { label: 'High (SPF 50)', color: 'text-orange-400', iconColor: 'text-orange-400' };
  }
  if (val < 11) {
    return { label: 'Very High (Seek Shade)', color: 'text-red-400', iconColor: 'text-red-400' };
  }

  return { label: 'Extreme (Avoid Sun)', color: 'text-purple-400', iconColor: 'text-purple-400' };
}

function getAirQualityDescription(aqi) {
  if (aqi == null || Number.isNaN(Number(aqi))) {
    return { label: 'Unavailable', color: 'text-slate-400', iconColor: 'text-slate-400' };
  }

  const val = Number(aqi);

  if (val <= 20) {
    return { label: 'Good', color: 'text-emerald-400', iconColor: 'text-emerald-400' };
  }
  if (val <= 40) {
    return { label: 'Fair', color: 'text-sky-400', iconColor: 'text-sky-400' };
  }
  if (val <= 60) {
    return { label: 'Moderate', color: 'text-amber-400', iconColor: 'text-amber-400' };
  }
  if (val <= 80) {
    return { label: 'Poor', color: 'text-orange-400', iconColor: 'text-orange-400' };
  }

  return { label: 'Very Poor', color: 'text-red-400', iconColor: 'text-red-400' };
}

function getFogRisk(temperature, dewPoint) {
  if (temperature == null || dewPoint == null) {
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
  subValueColor = 'text-slate-500',
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

        <p className={`mt-1.5 text-[11px] font-medium leading-tight ${subValueColor}`}>
          {subValue}
        </p>
      </div>
    </div>
  );
}

export default function CurrentConditions({ current }) {
  if (!current) return null;

  const temperature =
    current.temperatureC != null ? Number(current.temperatureC) : null;

  const dewPoint =
    current.dewpointTemperature != null
      ? Number(current.dewpointTemperature)
      : null;

  const windSpeed =
    current.windSpeedMps != null ? Number(current.windSpeedMps) : null;

  const humidity =
    current.humidityPercent != null ? Number(current.humidityPercent) : null;

  const pressure =
    current.pressureHpa != null ? Number(current.pressureHpa) : null;

  const rainfall =
    current.precipitationMm != null ? Number(current.precipitationMm) : null;

  const cloudiness =
    current.cloudiness != null ? Number(current.cloudiness) : null;

  const uvIndex =
    current.uvIndex != null ? Number(current.uvIndex) : null;

  const airQuality =
    current.airQuality != null ? Number(current.airQuality) : null;

  const fogRisk = getFogRisk(temperature, dewPoint);
  const uvInfo = getUvDescription(uvIndex);
  const aqInfo = getAirQualityDescription(airQuality);

  const weatherDescription =
    current.weatherDescription ||
    current.weatherSymbol ||
    'Current conditions';

  const windDescription = getWindDescription(windSpeed);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-7">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-sky-500/[0.06] blur-3xl" />

      {/* HERO */}
      <div className="relative z-10 flex items-center justify-between gap-4 lg:flex-row lg:items-center">
        {/* Temperature / Condition */}
        <div className="min-w-0 flex-1">
          <div className="mb- inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
              Current Conditions
            </span>
          </div>

          <div className="flex items-start">
            <span className="text-6xl font-black tracking-[-0.06em] text-white sm:text-7xl md:text-8xl">
              {temperature != null ? temperature : '—'}
            </span>

            {temperature != null && (
              <span className="ml-1.5 mt-2 text-2xl font-bold text-blue-400 sm:text-3xl md:text-4xl">
                °C
              </span>
            )}
          </div>

          <p className="mt-1.5 max-w-md text-base font-semibold capitalize text-slate-200 sm:text-lg md:text-xl">
            {weatherDescription}
          </p>
        </div>

        {/* HERO ICON - Inline on mobile with compact dimensions */}
        <div className="relative flex shrink-0 items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-blue-500/[0.08] blur-2xl md:h-52 md:w-52 md:blur-3xl" />

          <div className="relative rounded-full border border-slate-800/50 bg-slate-950/20 p-2 sm:p-3 md:p-4">
            <div className="rounded-full border border-slate-800/40 bg-slate-900/40 p-2.5 sm:p-3.5 md:p-5">
              <div className="text-blue-300 drop-shadow-[0_0_20px_rgba(96,165,250,0.25)]">
                <WeatherIcon
                  symbol={current.weatherSymbol}
                  className="h-14 w-14 sm:h-20 sm:w-20 md:h-36 md:w-36"
                  strokeWidth={1.25}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED METRICS (8 Cards) */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">

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
          label="Dew Point"
          value={formatValue(dewPoint, '°C')}
          subValue={fogRisk.label}
          subValueColor={fogRisk.color}
          icon={Thermometer}
          iconClass="text-teal-400"
        />

        <MetricCard
          label="Air Quality"
          value={`${formatValue(airQuality)} / 100`}
          subValue={`${aqInfo.label}`}
          icon={Activity}
          iconClass={aqInfo.iconColor}
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
          label="UV Index"
          value={formatValue(uvIndex)}
          subValue={uvInfo.label}
          icon={Sun}
          iconClass={uvInfo.iconColor}
        />
      </div>
    </section>
  );
}