import { MapPin } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useWeather } from '../context/WeatherContext';

export default function WeatherHeader() {
    const { locationName } = useWeather()

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between md:px-6">
      {/* Brand is a small label; the place you're looking at is the heading */}
      <div className="min-w-0">
        <p className="text-xs font-medium text-blue-400">ÉireWeather</p>

        <h1 className="mt-0.5 flex items-center gap-1.5 text-base font-semibold tracking-tight text-white sm:gap-2 sm:text-xl">
            <MapPin className="h-4 w-4 shrink-0 text-blue-400 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="sr-only">Weather for </span>
            <span className="truncate" title={locationName}>
                {locationName}
            </span>
        </h1>
      </div>

      <SearchBar />
    </header>
  );
}