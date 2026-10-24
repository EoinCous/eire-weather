import { useRef, useState } from 'react';
import { Search, LocateFixed, Loader2, X } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

export const SearchBar = () => {
  const { searchLocation, requestLocation } = useWeather();

  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState(null);
  const inputRef = useRef(null);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();

    const query = searchInput.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    setMessage(null);

    try {
      await searchLocation(query);
      // Only clear on success, so a typo can be fixed instead of retyped
      setSearchInput('');
      inputRef.current?.blur();
    } catch (err) {
      setMessage(err?.message || `Couldn't find "${query}". Try a nearby town.`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocate = async () => {
    if (isLocating) return;

    setIsLocating(true);
    setMessage(null);

    try {
      await requestLocation({ throwOnError: true });
    } catch (err) {
      setMessage(err?.message || "Couldn't get your location. Check your browser's location permission.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleClear = () => {
    setSearchInput('');
    setMessage(null);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full sm:w-auto">
      <div className="flex items-center gap-2">
      <form onSubmit={handleSearchSubmit} role="search" className="relative flex-1 sm:w-72 sm:flex-none">
        <label htmlFor="location-search" className="sr-only">
          Search for a town or city
        </label>

        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />

        <input
          ref={inputRef}
          id="location-search"
          name="location"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          placeholder="Search town or city"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            if (message) setMessage(null);
          }}
          aria-invalid={message ? 'true' : undefined}
          aria-describedby={message ? 'location-search-message' : undefined}
          /* text-base on mobile stops iOS Safari zooming the page on focus */
          className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-9 text-base text-slate-100 placeholder-slate-500 transition-colors focus:border-blue-500/80 focus:outline-none focus:ring-1 focus:ring-blue-500/80 sm:h-10 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />

        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden="true" />
        ) : (
          searchInput && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </form>

      <button
        type="button"
        onClick={handleLocate}
        disabled={isLocating}
        aria-label="Use my current location"
        title="Use my current location"
        className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:h-10 sm:w-auto sm:px-4"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="hidden md:inline">Current Location</span>
      </button>
      </div>

      {/* Inline feedback sits directly under the input, in normal flow */}
      {message && (
        <p id="location-search-message" role="alert" className="mt-2 px-1 text-xs text-rose-400">
          {message}
        </p>
      )}
    </div>
  );
};