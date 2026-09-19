import { Droplet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DailyForecast({ hourlyForecasts, WeatherIcon }) {
  const navigate = useNavigate();
  if (!hourlyForecasts || hourlyForecasts.length === 0) return null;

  // Group hourly entries into calendar days YYYY-MM-DD
  const daysMap = {};

  hourlyForecasts.forEach((item) => {
    const date = new Date(item.timestamp);
    const dateKey = date.toISOString().split('T')[0];

    if (!daysMap[dateKey]) {
      daysMap[dateKey] = {
        dateKey, // Store the key for routing
        date,
        temps: [],
        rain: 0,
        middaySymbol: item.weatherSymbol,
      };
    }

    if (item.temperatureC != null) daysMap[dateKey].temps.push(item.temperatureC);
    if (item.precipitationMm != null) daysMap[dateKey].rain += item.precipitationMm;

    // Pick midday symbol (approx 13:00) for representative daily condition
    const hour = date.getHours();
    if (hour >= 11 && hour <= 14) {
      daysMap[dateKey].middaySymbol = item.weatherSymbol;
    }
  });

  // Transform grouped days into formatted array (up to 10 days)
  const dailyList = Object.values(daysMap).slice(0, 10).map((day, idx) => ({
    dateKey: day.dateKey,
    dayName: idx === 0 ? 'Today' : day.date.toLocaleDateString('en-IE', { weekday: 'short' }),
    dateStr: day.date.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' }),
    minTemp: Math.round(Math.min(...day.temps)),
    maxTemp: Math.round(Math.max(...day.temps)),
    totalRain: Math.round(day.rain * 10) / 10,
    symbol: day.middaySymbol || 'cloud',
  }));

  const globalMin = Math.min(...dailyList.map((d) => d.minTemp));
  const globalMax = Math.max(...dailyList.map((d) => d.maxTemp));
  const tempRange = globalMax - globalMin || 1;

  const handleDayClick = (day) => {
    // Filter the original hourly data for just this day
    const dayHourlyData = hourlyForecasts.filter(h => h.timestamp.startsWith(day.dateKey));
    
    // Navigate to the detail page, passing the data in state
    navigate(`/day/${day.dateKey}`, { 
      state: { 
        daySummary: day, 
        hourlyData: dayHourlyData 
      } 
    });
  };

  return (
    <section className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 shadow-xl">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
        10-Day Forecast
      </h2>

      <div className="divide-y divide-slate-800/60">
        {dailyList.map((day, idx) => {
          const leftPercent = ((day.minTemp - globalMin) / tempRange) * 100;
          const widthPercent = Math.max(((day.maxTemp - day.minTemp) / tempRange) * 100, 10);

          return (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              className="py-3.5 flex items-center justify-between gap-3 sm:gap-4 first:pt-0 last:pb-0 hover:bg-slate-800/60 px-2 rounded-xl transition-colors cursor-pointer group"
            >
              {/* Day & Date */}
              <div className="w-20 sm:w-24 flex-shrink-0">
                <p className="font-semibold text-slate-100 text-sm group-hover:text-blue-400 transition-colors">{day.dayName}</p>
                <p className="text-[11px] text-slate-500 font-medium">{day.dateStr}</p>
              </div>

              {/* Weather Icon & Rain */}
              <div className="flex items-center gap-2 w-28 sm:w-32 flex-shrink-0">
                <div className="text-blue-400">
                  <WeatherIcon symbol={day.symbol} className="w-6 h-6" />
                </div>
                {day.totalRain > 0 ? (
                  <span className="text-[11px] text-blue-400 font-medium flex items-center gap-0.5">
                    <Droplet className="w-3 h-3" />
                    {day.totalRain}mm
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 capitalize truncate hidden sm:inline">
                    {day.symbol}
                  </span>
                )}
              </div>

              {/* Min Temp */}
              <span className="text-xs font-bold text-slate-400 w-7 text-right">
                {day.minTemp}°
              </span>

              {/* Relative Temperature Bar */}
              <div className="flex-1 max-w-[160px] h-2 bg-slate-800/80 rounded-full relative overflow-hidden hidden sm:block">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                />
              </div>

              {/* Max Temp */}
              <span className="text-sm font-bold text-slate-100 w-7 text-right">
                {day.maxTemp}°
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}