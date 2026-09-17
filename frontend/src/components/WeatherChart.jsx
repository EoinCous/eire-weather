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

export default function WeatherChart({ hourlyData }) {
  // Map raw API data to chart format
  const chartData = hourlyData.slice(0, 24).map((item) => ({
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
    </div>
  );
}