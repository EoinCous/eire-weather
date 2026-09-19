import { Wind, Droplet, Gauge, CloudRain, Cloud, CloudFog } from 'lucide-react';
import { WeatherIcon } from './WeatherIcon';

export default function CurrentConditions({ current }) {
  if (!current) return null;

  const isFogRisk =
    current.dewpointTemperature != null &&
    current.temperatureC - current.dewpointTemperature <= 2;

  const metrics = [
    {
      label: 'Wind Speed',
      value: `${current.windSpeedMps ?? 0} m/s`,
      subValue: current.windDirection || 'Stable',
      icon: Wind,
    },
    {
      label: 'Humidity',
      value: `${current.humidityPercent ?? 0}%`,
      subValue: 'Relative',
      icon: Droplet,
    },
    {
      label: 'Pressure',
      value: `${current.pressureHpa ?? 0} hPa`,
      subValue: 'Atmospheric',
      icon: Gauge,
    },
    {
      label: 'Rainfall',
      value: `${current.precipitationMm ?? 0} mm`,
      subValue: 'Past hour',
      icon: CloudRain,
    },
    {
      label: 'Cloud Cover',
      value: `${current.cloudiness ?? 0}%`,
      subValue:
        current.cloudiness > 80
          ? 'Overcast'
          : current.cloudiness > 30
          ? 'Partly Cloudy'
          : 'Clear Sky',
      icon: Cloud,
    },
    {
      label: 'Dew Point',
      value: `${current.dewpointTemperature ?? '--'}°C`,
      subValue: isFogRisk ? 'High Fog/Mist Risk' : 'Comfortable',
      subValueColor: isFogRisk ? 'text-amber-400 font-semibold' : 'text-slate-400',
      icon: CloudFog,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-blue-950/20">
      {/* Ambient Radial Background Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

      {/* Hero Section */}
      <div className="relative z-10 mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Current Conditions
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-7xl font-black tracking-tight text-white md:text-8xl">
              {current.temperatureC}
            </span>
            <span className="text-3xl font-bold text-blue-400 md:text-4xl">°C</span>
          </div>
          <p className="mt-2 text-lg font-medium capitalize text-slate-300 md:text-xl">
            {current.weatherSymbol || 'Clear'}
          </p>
        </div>

        {/* Large Hero Weather Icon */}
        <div className="relative flex items-center justify-center self-center md:self-auto">
          <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative text-blue-400 drop-shadow-[0_0_25px_rgba(59,130,246,0.35)]">
            <WeatherIcon
              symbol={current.weatherSymbol}
              className="h-32 w-32 md:h-40 md:w-40"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>

      {/* Integrated Metrics Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="group flex flex-col justify-between rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-slate-900/60"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {metric.label}
                </span>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-1.5 text-blue-400 transition-colors group-hover:border-blue-500/40 group-hover:bg-blue-500/20">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <p className="text-xl font-extrabold tracking-tight text-slate-100 md:text-2xl">
                  {metric.value}
                </p>
                <p
                  className={`mt-1 text-[11px] font-medium leading-tight ${
                    metric.subValueColor || 'text-slate-400'
                  }`}
                >
                  {metric.subValue}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}