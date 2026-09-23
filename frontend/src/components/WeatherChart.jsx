import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Droplet } from 'lucide-react';

// Custom Dark Tooltip matching the slate-950 theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs">
        <p className="font-semibold text-slate-300 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="font-medium flex items-center justify-between gap-4 my-1" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span className="font-bold text-slate-100">
              {entry.value}{entry.unit}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function WeatherChart({ hourlyForecasts, WeatherIcon }) {
  // Map raw API data to chart format
  const chartData = hourlyForecasts.slice(0, 24).map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: item.temperatureC != null ? Math.round(item.temperatureC) : 0,
    rain: item.precipitationMm ?? 0,
  }));

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
        24-Hour Forecast Trend
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              tick={{ fill: '#64748b', fontSize: 11 }} 
              tickLine={false}
            />
            {/* Left Axis: Temperature */}
            <YAxis 
              yAxisId="left" 
              stroke="#3b82f6" 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              tickLine={false} 
              unit="°"
            />
            {/* Right Axis: Rainfall Volume */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#06b6d4" 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              tickLine={false} 
              unit="mm"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} 
              formatter={(value) => <span className="text-slate-400 font-medium">{value}</span>}
            />
            {/* Rainfall Bar Chart Layer */}
            <Bar 
              yAxisId="right" 
              dataKey="rain" 
              name="Rainfall" 
              unit=" mm" 
              fill="#06b6d4" 
              radius={[4, 4, 0, 0]} 
              opacity={0.6}
            />
            {/* Temperature Line Layer */}
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="temp" 
              name="Temperature" 
              unit="°C" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ r: 3, fill: '#3b82f6' }} 
              activeDot={{ r: 6, fill: '#60a5fa' }} 
            />
          </ComposedChart>
        </ResponsiveContainer>

      </div>
      {/* Hourly Carousel */}
        <section className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {hourlyForecasts.slice(0, 24).map((item, idx) => (
              <div 
                key={item.timestamp || idx}
                className="flex-shrink-0 w-24 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-between gap-3 hover:bg-slate-800 transition-colors group cursor-default"
              >
                <span className="text-xs text-slate-400 font-medium group-hover:text-slate-300">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="text-slate-300 group-hover:text-blue-400 transition-colors">
                  <WeatherIcon symbol={item.weatherSymbol} className="w-8 h-8" />
                </div>
                <span className="text-lg font-bold text-slate-100">
                  {item.temperatureC != null ? `${Math.round(item.temperatureC)}°` : '--'}
                </span>
                <div className="h-4 flex items-center">
                  {item.precipitationMm > 0 && (
                    <span className="text-[11px] text-blue-400/90 font-medium flex items-center gap-1">
                      <Droplet className="w-3 h-3" /> {item.precipitationMm}mm
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
    </div>
  );
}