import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Cloud,
  CloudFog,
  CloudRain,
  Droplet,
  Gauge,
  Wind,
  Thermometer,
  CircleGauge,
} from 'lucide-react';

import { WeatherIcon } from '../components/WeatherIcon';
import SunMoonInfo from '../components/SunMoonInfo';
import { useWeather } from '../hooks/useWeather';

function formatNumber(value, decimals = 0) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  return Number(value).toFixed(decimals);
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCloudDescription(cloudiness) {
  if (cloudiness == null) return 'Unknown';

  if (cloudiness >= 80) return 'Overcast';
  if (cloudiness >= 50) return 'Mostly cloudy';
  if (cloudiness >= 20) return 'Partly cloudy';

  return 'Clear';
}

function getWindDescription(speed) {
  if (speed == null) return 'Unavailable';

  if (speed < 1) return 'Calm';
  if (speed < 4) return 'Light breeze';
  if (speed < 8) return 'Moderate';
  if (speed < 14) return 'Fresh';
  return 'Strong';
}

function getFogRisk(temperature, dewPoint) {
  if (
    temperature == null ||
    dewPoint == null
  ) {
    return null;
  }

  const spread = temperature - dewPoint;

  if (spread <= 2) {
    return 'Mist / fog possible';
  }

  if (spread <= 4) {
    return 'Mist possible';
  }

  return null;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-xl font-extrabold tracking-tight text-white">
            {value}
          </p>

          {subValue && (
            <p className="mt-1 text-[11px] text-slate-500">
              {subValue}
            </p>
          )}
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 ${iconClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function HourlyMetric({
  icon: Icon,
  label,
  value,
  iconClass = 'text-slate-400',
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} />

      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-slate-600">
          {label}
        </p>

        <p className="text-xs font-semibold text-slate-300">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DetailedDayForecast() {
  const location = useLocation();
  const navigate = useNavigate();

  const { coords } = useWeather();

  const {
    daySummary,
    hourlyData,
  } = location.state || {};

  /*
   * Calculate useful daily aggregates from the hourly data.
   */
  const dailyStats = useMemo(() => {
    if (!hourlyData?.length) {
      return {
        totalRain: null,
        maxWind: null,
        avgHumidity: null,
        avgCloudiness: null,
        avgPressure: null,
      };
    }

    const validTemperatures = hourlyData
      .map((hour) => Number(hour.temperatureC))
      .filter((value) => !Number.isNaN(value));

    const validWind = hourlyData
      .map((hour) => Number(hour.windSpeedMps))
      .filter((value) => !Number.isNaN(value));

    const validHumidity = hourlyData
      .map((hour) => Number(hour.humidityPercent))
      .filter((value) => !Number.isNaN(value));

    const validCloudiness = hourlyData
      .map((hour) => Number(hour.cloudiness))
      .filter((value) => !Number.isNaN(value));

    const validPressure = hourlyData
      .map((hour) => Number(hour.pressureHpa))
      .filter((value) => !Number.isNaN(value));

    const totalRain = hourlyData.reduce(
      (total, hour) =>
        total +
        (hour.precipitationMm != null
          ? Number(hour.precipitationMm)
          : 0),
      0
    );

    return {
      totalRain,

      maxWind:
        validWind.length > 0
          ? Math.max(...validWind)
          : null,

      avgHumidity:
        validHumidity.length > 0
          ? validHumidity.reduce(
              (sum, value) => sum + value,
              0
            ) / validHumidity.length
          : null,

      avgCloudiness:
        validCloudiness.length > 0
          ? validCloudiness.reduce(
              (sum, value) => sum + value,
              0
            ) / validCloudiness.length
          : null,

      avgPressure:
        validPressure.length > 0
          ? validPressure.reduce(
              (sum, value) => sum + value,
              0
            ) / validPressure.length
          : null,
    };
  }, [hourlyData]);

  // Fallback if accessed directly via URL without state
  if (!daySummary || !hourlyData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <p className="text-slate-400 mb-4">
          No data available for this date.
        </p>

        <button
          onClick={() => navigate('/')}
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* =====================================================
            BACK
        ====================================================== */}
        <button
          onClick={() => navigate(-1)}
          className="
            group mb-8 flex items-center gap-2
            text-slate-400 transition-colors
            hover:text-white
          "
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />

          <span className="text-sm font-medium">
            Back to Dashboard
          </span>
        </button>

        {/* =====================================================
            DAY HERO
        ====================================================== */}
        <section
          className="
            relative mb-5 overflow-hidden
            rounded-3xl border border-blue-500/20
            bg-gradient-to-br from-blue-900/30
            via-slate-900/50 to-slate-950/60
            p-6 shadow-2xl md:p-8
          "
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-400">
                Daily Forecast
              </p>

              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                {daySummary.dayName}
              </h1>

              <p className="mt-2 text-base font-medium text-slate-400">
                {daySummary.dateStr}
              </p>

              <div className="mt-6 flex items-end gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">
                    High
                  </p>

                  <p className="text-4xl font-black text-white">
                    {daySummary.maxTemp}°
                  </p>
                </div>

                <div className="pb-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-600">
                    Low
                  </p>

                  <p className="text-2xl font-bold text-slate-500">
                    {daySummary.minTemp}°
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center self-center md:self-auto">
              <div className="rounded-full border border-slate-800/60 bg-slate-950/30 p-5">
                <WeatherIcon
                  symbol={daySummary.symbol}
                  className="h-28 w-28 text-blue-300 md:h-36 md:w-36"
                  strokeWidth={1.25}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            DAILY SUMMARY
        ====================================================== */}
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">

          <StatCard
            icon={CloudRain}
            label="Rain"
            value={`${formatNumber(dailyStats.totalRain, 1)} mm`}
            subValue="Total for day"
            iconClass="text-cyan-400"
          />

          <StatCard
            icon={Wind}
            label="Max wind"
            value={`${formatNumber(dailyStats.maxWind, 1)} m/s`}
            subValue={
              dailyStats.maxWind != null
                ? getWindDescription(dailyStats.maxWind)
                : 'Unavailable'
            }
            iconClass="text-blue-400"
          />

          <StatCard
            icon={Droplet}
            label="Humidity"
            value={`${formatNumber(dailyStats.avgHumidity)}%`}
            subValue="Hourly average"
            iconClass="text-sky-400"
          />

          <StatCard
            icon={Cloud}
            label="Cloud cover"
            value={`${formatNumber(dailyStats.avgCloudiness)}%`}
            subValue="Hourly average"
            iconClass="text-slate-300"
          />

          <StatCard
            icon={Gauge}
            label="Pressure"
            value={`${formatNumber(dailyStats.avgPressure, 0)} hPa`}
            subValue="Hourly average"
            iconClass="text-violet-400"
          />
        </section>

        {/* =====================================================
            SUN & MOON
        ====================================================== */}
        {coords?.lat != null && coords?.lon != null && (
          <div className="mb-8">
            <SunMoonInfo
              lat={coords.lat}
              lon={coords.lon}
              date={daySummary.dateKey}
            />
          </div>
        )}

        {/* =====================================================
            HOURLY BREAKDOWN
        ====================================================== */}
        <section>
          <div className="mb-4 px-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Hourly Breakdown
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Detailed weather conditions throughout the day
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/30 shadow-xl">

            {/* Desktop header */}
            <div
              className="
                hidden border-b border-slate-800/60
                bg-slate-950/50
                px-5 py-3
                lg:grid
                lg:grid-cols-[90px_80px_90px_1fr]
                lg:items-center
              "
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Time
              </span>

              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Weather
              </span>

              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Temp
              </span>

              <div className="grid grid-cols-6 gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Rain
                </span>

                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Wind
                </span>

                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Humidity
                </span>

                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Cloud
                </span>

                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Dew point
                </span>

                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Pressure
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {hourlyData.map((hour, idx) => {
                const temperature =
                  hour.temperatureC != null
                    ? Number(hour.temperatureC)
                    : null;

                const rainfall =
                  hour.precipitationMm != null
                    ? Number(hour.precipitationMm)
                    : null;

                const windSpeed =
                  hour.windSpeedMps != null
                    ? Number(hour.windSpeedMps)
                    : null;

                const humidity =
                  hour.humidityPercent != null
                    ? Number(hour.humidityPercent)
                    : null;

                const cloudiness =
                  hour.cloudiness != null
                    ? Number(hour.cloudiness)
                    : null;

                const dewPoint =
                  hour.dewpointTemperature != null
                    ? Number(hour.dewpointTemperature)
                    : null;

                const pressure =
                  hour.pressureHpa != null
                    ? Number(hour.pressureHpa)
                    : null;

                const fogRisk = getFogRisk(
                  temperature,
                  dewPoint
                );

                return (
                  <div
                    key={hour.timestamp || idx}
                    className="
                      group px-4 py-5
                      transition-colors
                      hover:bg-slate-800/25
                      md:px-5
                    "
                  >
                    {/* =========================
                        DESKTOP
                    ========================== */}
                    <div className="hidden lg:grid lg:grid-cols-[90px_80px_90px_1fr] lg:items-center">

                      {/* Time */}
                      <div>
                        <p className="text-sm font-bold text-slate-200">
                          {formatTime(hour.timestamp)}
                        </p>
                      </div>

                      {/* Weather icon */}
                      <div>
                        <WeatherIcon
                          symbol={hour.weatherSymbol}
                          className="h-9 w-9 text-blue-300"
                        />
                      </div>

                      {/* Temperature */}
                      <div>
                        <p className="text-xl font-black text-white">
                          {formatNumber(temperature, 0)}°
                        </p>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-6 gap-4">

                        <HourlyMetric
                          icon={Droplet}
                          label="Rain"
                          value={
                            rainfall != null
                              ? `${rainfall.toFixed(1)} mm`
                              : '—'
                          }
                          iconClass="text-cyan-400"
                        />

                        <HourlyMetric
                          icon={Wind}
                          label="Wind"
                          value={
                            windSpeed != null
                              ? `${windSpeed.toFixed(1)} m/s ${
                                  hour.windDirection || ''
                                }`
                              : '—'
                          }
                          iconClass="text-blue-400"
                        />

                        <HourlyMetric
                          icon={Droplet}
                          label="Humidity"
                          value={
                            humidity != null
                              ? `${Math.round(humidity)}%`
                              : '—'
                          }
                          iconClass="text-sky-400"
                        />

                        <HourlyMetric
                          icon={Cloud}
                          label="Cloud"
                          value={
                            cloudiness != null
                              ? `${Math.round(cloudiness)}%`
                              : '—'
                          }
                          iconClass="text-slate-400"
                        />

                        <HourlyMetric
                          icon={CloudFog}
                          label="Dew point"
                          value={
                            dewPoint != null
                              ? `${dewPoint.toFixed(1)}°C`
                              : '—'
                          }
                          iconClass={
                            fogRisk
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }
                        />

                        <HourlyMetric
                          icon={Gauge}
                          label="Pressure"
                          value={
                            pressure != null
                              ? `${Math.round(pressure)} hPa`
                              : '—'
                          }
                          iconClass="text-violet-400"
                        />

                      </div>
                    </div>

                    {/* =========================
                        MOBILE / TABLET
                    ========================== */}
                    <div className="lg:hidden">

                      {/* Primary row */}
                      <div className="flex items-center justify-between gap-4">

                        <div className="w-16 shrink-0">
                          <p className="text-sm font-bold text-slate-200">
                            {formatTime(hour.timestamp)}
                          </p>
                        </div>

                        <div className="flex flex-1 items-center gap-3">

                          <WeatherIcon
                            symbol={hour.weatherSymbol}
                            className="h-9 w-9 shrink-0 text-blue-300"
                          />

                          <div>
                            <p className="text-xl font-black text-white">
                              {formatNumber(temperature, 0)}°
                            </p>

                            <p className="text-[10px] text-slate-600">
                              {getCloudDescription(cloudiness)}
                            </p>
                          </div>

                        </div>

                        <div className="text-right">
                          {rainfall != null &&
                          rainfall > 0 ? (
                            <div className="flex items-center justify-end gap-1 text-xs font-semibold text-cyan-400">
                              <CloudRain className="h-3 w-3" />
                              {rainfall.toFixed(1)} mm
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600">
                              No rain
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Secondary metrics */}
                      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-800/50 pt-4 sm:grid-cols-3">

                        <HourlyMetric
                          icon={Wind}
                          label="Wind"
                          value={
                            windSpeed != null
                              ? `${windSpeed.toFixed(1)} m/s ${
                                  hour.windDirection || ''
                                }`
                              : '—'
                          }
                          iconClass="text-blue-400"
                        />

                        <HourlyMetric
                          icon={Droplet}
                          label="Humidity"
                          value={
                            humidity != null
                              ? `${Math.round(humidity)}%`
                              : '—'
                          }
                          iconClass="text-sky-400"
                        />

                        <HourlyMetric
                          icon={Cloud}
                          label="Cloud cover"
                          value={
                            cloudiness != null
                              ? `${Math.round(cloudiness)}%`
                              : '—'
                          }
                          iconClass="text-slate-400"
                        />

                        <HourlyMetric
                          icon={CloudFog}
                          label="Dew point"
                          value={
                            dewPoint != null
                              ? `${dewPoint.toFixed(1)}°C`
                              : '—'
                          }
                          iconClass={
                            fogRisk
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }
                        />

                        <HourlyMetric
                          icon={Gauge}
                          label="Pressure"
                          value={
                            pressure != null
                              ? `${Math.round(pressure)} hPa`
                              : '—'
                          }
                          iconClass="text-violet-400"
                        />

                        <HourlyMetric
                          icon={Thermometer}
                          label="Temperature"
                          value={
                            temperature != null
                              ? `${temperature.toFixed(1)}°C`
                              : '—'
                          }
                          iconClass="text-orange-400"
                        />

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}