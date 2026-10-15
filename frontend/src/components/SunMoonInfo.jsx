import { useState, useMemo } from 'react';
import {
  getTimes,
  getMoonIllumination,
  getMoonTimes,
} from 'suncalc';
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  MoonStar,
  ChevronDown,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

function parseLocalDate(date) {
  if (date instanceof Date) {
    return date;
  }

  // Treat YYYY-MM-DD as a local calendar date rather than UTC
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(date);
}

function getMoonPhaseName(phase) {
  if (phase < 0.03 || phase >= 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

function formatTime(date) {
  if (!date || Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(start, end) { 
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) { 
    return '—'; 
  } 
  const durationMs = end.getTime() - start.getTime(); 
  const totalMinutes = Math.round(durationMs / (1000 * 60)); 
  const hours = Math.floor(totalMinutes / 60); 
  const minutes = totalMinutes % 60; 
  if (hours === 0) { 
    return `${minutes}m`; 
  } 
  return `${hours}h ${minutes}m`; 
}

function TimeRow({ icon: Icon, label, time, iconClass = 'text-slate-400' }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconClass}`} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>

      <span className="text-sm font-semibold text-slate-100">
        {formatTime(time)}
      </span>
    </div>
  );
}

export default function SunMoonInfo({ date = new Date(), initialExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const { coords } = useWeather();
  const { lat, lon } = coords;

  const data = useMemo(() => {
    const parsedDate = parseLocalDate(date);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      typeof lat !== 'number' ||
      typeof lon !== 'number'
    ) {
      return null;
    }

    const sunTimes = getTimes(parsedDate, lat, lon);
    const moonIllumination = getMoonIllumination(parsedDate);
    const moonTimes = getMoonTimes(parsedDate, lat, lon);

    const daylightDuration = formatDuration(sunTimes.sunrise, sunTimes.sunset);

    return {
      date: parsedDate,
      sunTimes,
      moonIllumination,
      moonTimes,
      daylightDuration,
      phaseName: getMoonPhaseName(moonIllumination.phase),
      illuminationPercent: Math.round(
        moonIllumination.fraction * 100
      ),
    };
  }, [date, lat, lon]);

  if (!data) {
    return null;
  }

  const {
    sunTimes,
    moonTimes,
    phaseName,
    illuminationPercent,
    daylightDuration
  } = data;

  return (
    <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
      {/* Clickable Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-5 py-4 md:px-6 flex items-center justify-between gap-4 text-left transition-colors hover:bg-slate-800/30 focus:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">
              Sun & Moon
            </h2>

            {/* Quick Summary Pill when collapsed */}
            <p className="text-xs text-slate-400 truncate">
              Sunrise {formatTime(sunTimes.sunrise)} • Sunset {formatTime(sunTimes.sunset)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            {isExpanded ? 'Hide details' : 'Show details'}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-5 md:p-6 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
          
          {/* Sun */}
          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Sun
              </h3>
            </div>

            <div className="divide-y divide-slate-800/50">
              <TimeRow
                icon={Sunrise}
                label="Dawn"
                time={sunTimes.dawn}
                iconClass="text-orange-300"
              />
              <TimeRow
                icon={Sunrise}
                label="Sunrise"
                time={sunTimes.sunrise}
                iconClass="text-amber-300"
              />
              <TimeRow
                icon={Sunset}
                label="Sunset"
                time={sunTimes.sunset}
                iconClass="text-orange-400"
              />
              <TimeRow
                icon={Sunset}
                label="Dusk"
                time={sunTimes.dusk}
                iconClass="text-purple-400"
              />

              {/* Daylight Duration */} 
              <div className="flex items-center justify-between py-3"> 
                <div className="flex items-center gap-3"> 
                  <Sun className="w-5 h-5 text-yellow-300" /> 
                  <span className="text-sm text-slate-300"> Daylight Duration </span> 
                </div> 
                <span className="text-sm font-bold text-yellow-200"> 
                  {daylightDuration} 
                </span> 
              </div>
            </div>
          </div>

          {/* Moon */}
          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-4 h-4 text-sky-300" />
              <h3 className="text-sm font-semibold text-slate-200">
                Moon
              </h3>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <MoonStar className="w-6 h-6 text-slate-200" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {phaseName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {illuminationPercent}% illuminated
                  </p>
                </div>
              </div>

              {/* Illumination bar */}
              <div className="mt-4">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-300 rounded-full transition-all"
                    style={{
                      width: `${illuminationPercent}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-800/50">
              <TimeRow
                icon={Moon}
                label="Moonrise"
                time={moonTimes.rise}
                iconClass="text-sky-300"
              />

              <TimeRow
                icon={Moon}
                label="Moonset"
                time={moonTimes.set}
                iconClass="text-indigo-300"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}