import { useState } from "react";
import { Search, MapPin } from "lucide-react";

export const SearchBar = ({ searchLocation, requestLocation }) => {
    const [searchInput, setSearchInput] = useState('');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
        searchLocation(searchInput);
        setSearchInput('');
        }
    };

    return(
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search city or town..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <button 
            onClick={() => requestLocation()}
            title="Use Current Location"
            className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors text-white rounded-xl shadow-md flex-shrink-0"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden md:inline ml-2">Current Location</span>
          </button>
        </div>
    )
}