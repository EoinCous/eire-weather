import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';

const WET_THRESHOLD_MM = 0.1; // below this counts as dry
const MIN_RAIN_SCALE_MM = 2; // fixed floor so drizzle never looks like a downpour

// Irish convention: 24-hour clock
function formatHour(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-IE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatWeekday(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-IE', { weekday: 'short' });
}

// True when the timestamp is the hour we are currently in
function isCurrentHour(timestamp) {
  const elapsed = Date.now() - new Date(timestamp).getTime();
  return elapsed >= 0 && elapsed < 60 * 60 * 1000;
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// Turns the hourly data into a sentence a person can read in one second
function describeRain(data) {
  const wet = data.map((d) => d.rain >= WET_THRESHOLD_MM);

  if (!wet.some(Boolean)) return 'Dry for the next 24 hours';
  if (wet.every(Boolean)) return 'Rain throughout the next 24 hours';

  if (!wet[0]) {
    const firstWet = wet.indexOf(true);
    return `Dry until ${data[firstWet].time}, then rain`;
  }

  const firstDry = wet.indexOf(false);
  return `Rain until ${data[firstDry].time}`;
}

function rainColour(mm) {
  if (mm >= 2) return '#0891b2';
  if (mm >= 0.5) return '#06b6d4';
  return '#67e8f9';
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[150px]">
      <p className="text-xs font-semibold text-slate-300 mb-2">{point.label}</p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-slate-400">Temperature</span>
          <span className="text-sm font-bold text-slate-100">
            {point.temp != null ? `${point.temp}°C` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-slate-400">Rain</span>
          <span className="text-sm font-bold text-slate-100">
            {point.rain >= WET_THRESHOLD_MM ? `${point.rain.toFixed(1)} mm` : 'Dry'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Props:
 *  - hourlyForecasts: array of { timestamp, temperatureC, precipitationMm, weatherSymbol }
 *  - WeatherIcon (optional): your existing icon component. It is rendered as
 *    <WeatherIcon symbol={...} className="..." />. Rename the `symbol` prop below
 *    if your component expects something different.
 */
export default function WeatherChart({ hourlyForecasts, WeatherIcon }) {
  const forecasts = hourlyForecasts?.slice(0, 24) ?? [];

  const model = useMemo(() => {
    if (forecasts.length === 0) return null;

    const first = forecasts[0].timestamp;

    const data = forecasts.map((item, index) => {
      const time = formatHour(item.timestamp);
      const sameDay = isSameDay(item.timestamp, first);

      return {
        index,
        timestamp: item.timestamp,
        time,
        label: sameDay ? time : `${formatWeekday(item.timestamp)} ${time}`,
        temp: item.temperatureC != null ? Math.round(item.temperatureC) : null,
        rain: item.precipitationMm != null ? Number(item.precipitationMm) : 0,
        weatherSymbol: item.weatherSymbol,
      };
    });

    const withTemp = data.filter((d) => d.temp != null);
    const low = withTemp.length ? withTemp.reduce((a, b) => (b.temp < a.temp ? b : a)) : null;
    const high = withTemp.length ? withTemp.reduce((a, b) => (b.temp > a.temp ? b : a)) : null;

    const maxRain = Math.max(...data.map((d) => d.rain), 0);
    const totalRain = data.reduce((sum, d) => sum + d.rain, 0);
    const peak = maxRain >= WET_THRESHOLD_MM ? data.find((d) => d.rain === maxRain) : null;

    // First hour that falls on a different calendar day marks midnight
    const midnight = data.find((d, i) => i > 0 && !isSameDay(forecasts[i].timestamp, first));

    // Temperature domain: leave the bottom of the chart free for the rain bars
    const range = low && high ? Math.max(high.temp - low.temp, 3) : 3;
    const tempMin = low ? low.temp - range * 0.9 : 0;
    const tempMax = high ? high.temp + 1 : 10;

    // Rain domain: bars fill the bottom third at most, on a fixed minimum scale
    const rainMax = Math.max(maxRain, MIN_RAIN_SCALE_MM) * 3;

    return {
      data,
      low,
      high,
      totalRain,
      peak,
      midnight,
      tempMin,
      tempMax,
      rainMax,
      headline: describeRain(data),
    };
  }, [forecasts]);

  if (!model) return null;

  const { data, low, high, totalRain, peak, midnight, tempMin, tempMax, rainMax, headline } = model;

  return (
    <section
      className="bg-slate-900/30 border border-slate-800/50 rounded-3xl shadow-xl overflow-hidden"
      aria-label="Next 24 hours forecast"
    >
      {/* Headline: the answer first */}
      <div className="p-5 md:p-6 pb-2 md:pb-2">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{headline}</h2>

        <p className="text-sm text-slate-400 mt-1.5">
          {totalRain >= WET_THRESHOLD_MM ? `${totalRain.toFixed(1)} mm expected in total` : 'No measurable rain expected'}
          {peak ? `, heaviest around ${peak.time} (${peak.rain.toFixed(1)} mm)` : ''}
        </p>
      </div>

      {/* Glanceable strip.
          Mobile: every hour in one swipeable row.
          sm and up: every 3rd hour, spread evenly across the card. */}
      <div className="relative pt-4">
        <div
          className="flex gap-1 overflow-x-auto snap-x snap-mandatory px-4 md:px-6 pb-1
                     sm:grid sm:grid-cols-8 sm:overflow-visible
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Hourly forecast, swipe to see more"
        >
          {data.map((slot) => {
            const isNow = slot.index === 0 && isCurrentHour(slot.timestamp);
            const isMidnight = midnight && slot.index === midnight.index;
            const label = isNow ? 'Now' : isMidnight ? formatWeekday(slot.timestamp) : slot.time;

            return (
              <div
                key={slot.index}
                role="listitem"
                className={`${
                  slot.index % 3 === 0 ? 'flex' : 'flex sm:hidden'
                } flex-col items-center gap-1.5 shrink-0 w-14 sm:w-auto snap-start py-1 ${
                  isMidnight ? 'border-l border-slate-700/80' : ''
                }`}
              >
                <span
                  className={`text-[11px] ${
                    isNow || isMidnight ? 'font-semibold text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>

                {WeatherIcon && slot.weatherSymbol ? (
                  <WeatherIcon symbol={slot.weatherSymbol} className="w-6 h-6 text-slate-300" />
                ) : null}

                <span className="text-sm font-semibold text-slate-100">
                  {slot.temp != null ? `${slot.temp}°` : '—'}
                </span>

                <span
                  className={`text-[11px] ${
                    slot.rain >= WET_THRESHOLD_MM ? 'text-cyan-400 font-medium' : 'text-slate-600'
                  }`}
                >
                  {slot.rain >= WET_THRESHOLD_MM ? `${slot.rain.toFixed(1)} mm` : 'Dry'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Fade on the right edge hints that the row scrolls (mobile only) */}
        <div className="pointer-events-none absolute right-0 top-4 bottom-1 w-10 bg-gradient-to-l from-slate-900 to-transparent sm:hidden" />
      </div>

      {/* Chart */}
      <div className="px-2 md:px-4 pt-4 pb-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 24, right: 16, left: 16, bottom: 0 }} barCategoryGap="15%">
              <defs>
                <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="index"
                tickFormatter={(i) => data[i]?.time ?? ''}
                interval={2}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />

              {/* Both value axes are hidden: values are labelled directly instead */}
              <YAxis yAxisId="temperature" hide domain={[tempMin, tempMax]} />
              <YAxis yAxisId="rain" hide domain={[0, rainMax]} />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeDasharray: '3 3' }} />

              {midnight && (
                <ReferenceLine
                  yAxisId="temperature"
                  x={midnight.index}
                  stroke="#475569"
                  strokeDasharray="4 4"
                  label={{
                    value: formatWeekday(forecasts[midnight.index].timestamp),
                    position: 'insideTopRight',
                    fill: '#94a3b8',
                    fontSize: 10,
                  }}
                />
              )}

              <Area
                yAxisId="temperature"
                type="monotone"
                dataKey="temp"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#tempFill)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#93c5fd', fill: '#3b82f6' }}
                connectNulls={false}
                isAnimationActive={false}
              />

              <Bar yAxisId="rain" dataKey="rain" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.index} fill={rainColour(d.rain)} fillOpacity={d.rain >= WET_THRESHOLD_MM ? 0.85 : 0} />
                ))}
              </Bar>

              {/* Label the extremes directly instead of using an axis */}
              {high && (
                <ReferenceDot
                  yAxisId="temperature"
                  x={high.index}
                  y={high.temp}
                  r={4}
                  fill="#fb923c"
                  stroke="#0f172a"
                  strokeWidth={2}
                  label={{ value: `${high.temp}°`, position: 'top', fill: '#fdba74', fontSize: 12, fontWeight: 600 }}
                />
              )}

              {low && low.index !== high?.index && (
                <ReferenceDot
                  yAxisId="temperature"
                  x={low.index}
                  y={low.temp}
                  r={4}
                  fill="#60a5fa"
                  stroke="#0f172a"
                  strokeWidth={2}
                  label={{ value: `${low.temp}°`, position: 'top', fill: '#93c5fd', fontSize: 12, fontWeight: 600 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-5 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[11px] text-slate-500">Temperature</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/70" />
            <span className="text-[11px] text-slate-500">Rain per hour</span>
          </div>
        </div>
      </div>
    </section>
  );
}