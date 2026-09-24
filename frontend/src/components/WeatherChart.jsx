import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import {
  CloudRain,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

function formatHour(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortHour(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const temperature = payload.find(
    (entry) => entry.dataKey === 'temp'
  );

  const rainfall = payload.find(
    (entry) => entry.dataKey === 'rain'
  );

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md min-w-[160px]">
      <p className="text-xs font-semibold text-slate-300 mb-3">
        {label}
      </p>

      <div className="space-y-2">
        {temperature && temperature.value != null && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs text-slate-400">
                Temperature
              </span>
            </div>

            <span className="text-sm font-bold text-slate-100">
              {temperature.value}°C
            </span>
          </div>
        )}

        {rainfall && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs text-slate-400">
                Rain
              </span>
            </div>

            <span className="text-sm font-bold text-slate-100">
              {Number(rainfall.value).toFixed(1)} mm
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, iconClass }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-800/70 flex items-center justify-center">
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          {label}
        </p>

        <p className="text-sm font-bold text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function WeatherChart({
  hourlyForecasts
}) {
  const forecasts = hourlyForecasts?.slice(0, 24) ?? [];

  if (forecasts.length === 0) {
    return null;
  }

  const chartData = forecasts.map((item, index) => ({
    timestamp: item.timestamp,
    time: formatHour(item.timestamp),
    chartTime: formatShortHour(item.timestamp),
    temp:
      item.temperatureC != null
        ? Math.round(item.temperatureC)
        : null,
    rain:
      item.precipitationMm != null
        ? Number(item.precipitationMm)
        : 0,
    weatherSymbol: item.weatherSymbol,
    index,
  }));

  const temperatures = chartData
    .map((item) => item.temp)
    .filter((value) => value != null);

  const maxRain = Math.max(
    ...chartData.map((item) => item.rain),
    0
  );

  const minTemp =
    temperatures.length > 0
      ? Math.floor(Math.min(...temperatures) - 1)
      : 0;

  const maxTemp =
    temperatures.length > 0
      ? Math.ceil(Math.max(...temperatures) + 1)
      : 10;

  const lowTemp =
    temperatures.length > 0
      ? Math.min(...temperatures)
      : null;

  const highTemp =
    temperatures.length > 0
      ? Math.max(...temperatures)
      : null;

  const totalRain = chartData.reduce(
    (total, item) => total + item.rain,
    0
  );

  const rainDomainMax =
    maxRain > 0
      ? Math.max(Math.ceil(maxRain * 1.25 * 10) / 10, 1)
      : 1;

  return (
    <section className="bg-slate-900/30 border border-slate-800/50 rounded-3xl shadow-xl overflow-hidden">

      {/* Header */}
      <div className="p-5 md:p-6 border-b border-slate-800/50">
        <div className="flex flex-col gap-5">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white uppercase tracking-widest">
                  Next 24 Hours
                </h2>

                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 uppercase tracking-wide">
                  Hourly
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Temperature and precipitation over the next 24 hours
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 sm:gap-5">
              <SummaryStat
                icon={TrendingDown}
                label="Low"
                value={lowTemp != null ? `${lowTemp}°C` : '—'}
                iconClass="text-blue-400"
              />

              <SummaryStat
                icon={TrendingUp}
                label="High"
                value={highTemp != null ? `${highTemp}°C` : '—'}
                iconClass="text-orange-400"
              />

              <SummaryStat
                icon={CloudRain}
                label="Rain"
                value={`${totalRain.toFixed(1)} mm`}
                iconClass="text-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-5 md:px-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{
                top: 10,
                right: 0,
                left: -15,
                bottom: 0,
              }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />

              <XAxis
                dataKey="chartTime"
                stroke="#475569"
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
                interval={1}
              />

              {/* Temperature axis */}
              <YAxis
                yAxisId="temperature"
                orientation="left"
                domain={[minTemp, maxTemp]}
                tick={{
                  fill: '#94a3b8',
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={(value) => `${value}°`}
              />

              {/* Rain axis */}
              <YAxis
                yAxisId="rain"
                orientation="right"
                domain={[0, rainDomainMax]}
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
                width={32}
                tickFormatter={(value) => `${value}`}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: 'rgba(51, 65, 85, 0.18)',
                }}
              />

              {/* Rainfall */}
              <Bar
                yAxisId="rain"
                dataKey="rain"
                name="Rainfall"
                fill="#06b6d4"
                fillOpacity={0.45}
                radius={[5, 5, 0, 0]}
                maxBarSize={18}
              />

              {/* Temperature */}
              <Line
                yAxisId="temperature"
                type="monotone"
                dataKey="temp"
                name="Temperature"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: '#93c5fd',
                  fill: '#3b82f6',
                }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Axis legend */}
        <div className="flex items-center justify-center gap-5 pb-4 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[11px] text-slate-500">
              Temperature
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/60" />
            <span className="text-[11px] text-slate-500">
              Rainfall
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}