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
} from 'lucide-react';
import { useMemo } from 'react';

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

function formatDate(date) {
  return date.toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatDuration(start, end) { 
    if ( !start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ) { 
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

export default function SunMoonInfo({ lat, lon, date = new Date() }) {
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

    const daylightDuration = formatDuration( sunTimes.sunrise, sunTimes.sunset );

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
    date: parsedDate,
    sunTimes,
    moonTimes,
    phaseName,
    illuminationPercent,
    daylightDuration
  } = data;

  return (
    <section className="bg-slate-900/50 border border-slate-800/60 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 md:px-6 border-b border-slate-800/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              Sun & Moon
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {formatDate(parsedDate)}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Moon illumination</div>
            <div className="text-lg font-bold text-slate-100">
              {illuminationPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        
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
    </section>
  );
}