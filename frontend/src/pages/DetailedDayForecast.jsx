import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplet, Wind } from 'lucide-react';
import { WeatherIcon } from '../components/WeatherIcon';

export default function DetailedDayForecast() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { daySummary, hourlyData } = location.state || {};

  // Fallback if accessed directly via URL without state
  if (!daySummary || !hourlyData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <p className="text-slate-400 mb-4">No data available for this date.</p>
        <button onClick={() => navigate('/')} className="text-blue-400 hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header / Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Day Summary Card */}
        <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/50 border border-blue-500/20 rounded-3xl p-8 shadow-2xl mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
              {daySummary.dayName}
            </h1>
            <p className="text-slate-400 font-medium text-lg mb-4">{daySummary.dateStr}</p>
            <div className="flex gap-4">
              <span className="text-3xl font-bold text-white">{daySummary.maxTemp}°</span>
              <span className="text-3xl font-bold text-slate-500">{daySummary.minTemp}°</span>
            </div>
          </div>
          <div className="text-blue-400">
            <WeatherIcon symbol={daySummary.symbol} className="w-32 h-32" />
          </div>
        </div>

        {/* Hourly Breakdown List */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 px-2">
          Hourly Breakdown
        </h2>
        
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-2 sm:p-6 shadow-xl">
          <div className="divide-y divide-slate-800/60">
            {hourlyData.map((hour, idx) => {
              const time = new Date(hour.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div key={idx} className="py-4 px-4 flex items-center justify-between hover:bg-slate-800/30 rounded-xl transition-colors">
                  <span className="text-slate-300 font-medium w-16">{time}</span>
                  
                  <div className="flex items-center gap-2 w-24 text-blue-400">
                    <WeatherIcon symbol={hour.weatherSymbol} className="w-6 h-6" />
                    <span className="text-sm capitalize truncate hidden sm:inline">
                      {hour.weatherSymbol}
                    </span>
                  </div>

                  <span className="text-xl font-bold text-white w-12 text-center">
                    {Math.round(hour.temperatureC)}°
                  </span>

                  <div className="flex gap-4 w-32 justify-end">
                    {hour.precipitationMm > 0 && (
                      <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
                        <Droplet className="w-3 h-3" />
                        {hour.precipitationMm}mm
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      {hour.windSpeedMps}m/s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}