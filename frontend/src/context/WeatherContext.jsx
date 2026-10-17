import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

const WeatherContext = createContext(null);

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://ec2-54-78-124-210.eu-west-1.compute.amazonaws.com:8080/api/v1/weather';

const SAVED_LOCATION_KEY = 'eireweather-location';

const FALLBACK_COORDS = {
  lat: 53.7374,
  lon: -7.9061,
};

/* =========================================================
   Local storage helpers
========================================================= */

function getSavedLocation() {
  try {
    const saved = localStorage.getItem(
      SAVED_LOCATION_KEY
    );

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);

    if (
      typeof parsed.lat !== 'number' ||
      typeof parsed.lon !== 'number'
    ) {
      return null;
    }

    return {
      lat: parsed.lat,
      lon: parsed.lon,
      name: parsed.name || null,
    };
  } catch {
    return null;
  }
}

function saveLocation(location) {
  try {
    localStorage.setItem(
      SAVED_LOCATION_KEY,
      JSON.stringify(location)
    );
  } catch {
    // Ignore localStorage failures
  }
}

/* =========================================================
   Geolocation
========================================================= */

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          'Geolocation is not supported by this browser.'
        )
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
}

/* =========================================================
   Nominatim helpers
========================================================= */

function getLocationName(address, displayName = '') {
  if (!address && displayName) {
    return displayName.split(',')[0].trim();
  }
  console.log(address)

  const locality =
    address?.road ||
    address?.town ||
    address?.city ||
    address?.village ||
    address?.municipality ||
    address?.suburb ||
    address?.neighbourhood;

  let county = address?.county;

  if (county && !county.toLowerCase().startsWith('county') && !county.toLowerCase().startsWith('co.')) {
    county = `Co. ${county}`;
  }

  if (locality && county) {
    return `${locality}, ${county}`;
  }

  if (locality) return locality;

  if (county) return county;

  const broaderLocation = address?.state || address?.country;
  if (broaderLocation) return broaderLocation;

  if (displayName) {
    return displayName.split(',')[0].trim();
  }

  return 'Unknown Location';
}

async function reverseGeocode(lat, lon, signal) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error('Reverse geocoding failed');
  }

  const data = await response.json();

  return getLocationName(data.address, data.display_name);
}

export function WeatherProvider({ children }) {
  /*
   * Read the saved location synchronously.
   *
   * This means a returning user immediately has coordinates
   * available without waiting for browser geolocation.
   */
  const savedLocation = useRef(
    getSavedLocation()
  ).current;

  const [coords, setCoords] = useState(() => {
    if (!savedLocation) {
      return null;
    }

    return {
      lat: savedLocation.lat,
      lon: savedLocation.lon,
    };
  });

  const [weather, setWeather] = useState(null);

  const [warnings, setWarnings] = useState([]);

  const [locationName, setLocationName] =
    useState(
      savedLocation?.name || 'Locating...'
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /*
   * Prevent the initial geolocation request from
   * being triggered repeatedly.
   */
  const initialLocationRequested =
    useRef(false);

  /* =======================================================
     Initial location
  ======================================================== */

  useEffect(() => {
    /*
     * We already have a saved location.
     * Do not ask for browser location again.
     */
    if (coords) {
      return;
    }

    if (initialLocationRequested.current) {
      return;
    }

    initialLocationRequested.current = true;

    getCurrentPosition()
      .then((position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: null,
        };

        saveLocation(newLocation);

        setLocationName('Locating...');

        setCoords({
          lat: newLocation.lat,
          lon: newLocation.lon,
        });
      })
      .catch(() => {
        /*
         * Location was denied/unavailable.
         * Use fallback coordinates.
         */
        const fallback = {
          ...FALLBACK_COORDS,
          name: null,
        };

        setCoords({
          lat: fallback.lat,
          lon: fallback.lon,
        });
      });
  }, [coords]);

  /* =======================================================
     Weather
  ======================================================== */

  useEffect(() => {
    if (!coords) {
      return;
    }

    const controller =
      new AbortController();

    async function fetchWeather() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            'Failed to fetch weather'
          );
        }

        const data = await response.json();

        setWeather(data);
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        setError(
          err.message ||
            'Error loading weather data'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      controller.abort();
    };
  }, [coords]);

  /* =======================================================
     Weather warnings
     
     Warnings are independent of the user's location,
     so fetch them once when the provider mounts.
  ======================================================== */

  useEffect(() => {
    const controller =
      new AbortController();

    async function fetchWarnings() {
      try {
        const response = await fetch(
          `${BASE_URL}/warnings`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          setWarnings([]);
          return;
        }

        const data = await response.json();

        setWarnings(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        /*
         * Warning failure shouldn't prevent
         * the weather application from working.
         */
        setWarnings([]);
      }
    }

    fetchWarnings();

    return () => {
      controller.abort();
    };
  }, []);

  /* =======================================================
     Reverse geocoding
  ======================================================== */

  useEffect(() => {
    if (!coords) {
      return;
    }

    const saved = getSavedLocation();

    const isSameSavedLocation =
      saved &&
      saved.lat === coords.lat &&
      saved.lon === coords.lon &&
      saved.name;

    if (isSameSavedLocation) {
      setLocationName(saved.name);
      return;
    }

    const controller = new AbortController();

    async function fetchLocationName() {
      try {
        const name =
          await reverseGeocode(
            coords.lat,
            coords.lon,
            controller.signal
          );

        if (controller.signal.aborted) {
          return;
        }

        setLocationName(name);

        saveLocation({
          lat: coords.lat,
          lon: coords.lon,
          name,
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        setLocationName(
          `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`
        );
      }
    }

    fetchLocationName();

    return () => {
      controller.abort();
    };
  }, [coords]);

  const requestLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const position =
        await getCurrentPosition();

      const newLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        name: null,
      };

      saveLocation(newLocation);

      setLocationName('Locating...');

      setCoords({
        lat: newLocation.lat,
        lon: newLocation.lon,
      });
    } catch {
      setError(
        'Unable to determine your current location.'
      );

      setLoading(false);
    }
  };

  const searchLocation = async (query) => {
    if (!query?.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Restrict Nominatim search strictly to IE (Republic of Ireland) & GB (UK / Northern Ireland)
      // Request limit=5 so we can filter out non-NI UK locations if necessary
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ie,gb&q=${encodeURIComponent(
          query.trim()
        )}&limit=5`,
        {
          headers: {
            'User-Agent': 'EireWeatherApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search location');
      }

      const data = await response.json();

      if (!data?.length) {
        setError(`No location found in Ireland or Northern Ireland for "${query}"`);
        setLoading(false);
        return;
      }

      // Valid Northern Ireland counties list to ensure UK results stay within NI
      const niCounties = [
        'antrim',
        'armagh',
        'down',
        'fermanagh',
        'londonderry',
        'derry',
        'tyrone',
        'county antrim',
        'county armagh',
        'county down',
        'county fermanagh',
        'county londonderry',
        'county derry',
        'county tyrone'
      ];

      // Find the first result that is either in the Republic of Ireland (IE) or in Northern Ireland
      const filteredResult = data.find((item) => {
        const countryCode = item.address?.country_code?.toLowerCase();
        const county = item.address?.county?.toLowerCase() || '';
        const state = item.address?.state?.toLowerCase() || '';
        
        // Match Republic of Ireland
        if (countryCode === 'ie') {
          return true;
        }

        // Match Northern Ireland within UK results
        if (countryCode === 'gb' || countryCode === 'uk') {
          return (
            state.includes('northern ireland') ||
            niCounties.some((niCounty) => county.includes(niCounty))
          );
        }

        return false;
      });
      if (!filteredResult) {
        setError(`No matches found in Ireland or Northern Ireland for "${query}"`);
        setLoading(false);
        return;
      }

      const name = getLocationName(filteredResult.address, filteredResult.display_name);

      const newLocation = {
        lat: parseFloat(filteredResult.lat),
        lon: parseFloat(filteredResult.lon),
        name: name
      };

      saveLocation(newLocation);
      setLocationName(newLocation.name);
      setCoords({
        lat: newLocation.lat,
        lon: newLocation.lon,
      });

    } catch (err) {
      setError(
        'Failed to search location. Please try again.'
      );

      setLoading(false);
    }
  };

  /**
   * Generalized AI summary fetcher supporting CURRENT, SINGLE_DAY, and TEN_DAY scopes.
   * 
   * @param {string} scope 'CURRENT' | 'SINGLE_DAY' | 'TEN_DAY'
   * @param {string|null} date Optional date string 'YYYY-MM-DD' for SINGLE_DAY scope
   */
  const fetchAiSummary = async (scope = 'CURRENT', date = null) => {
    if (coords?.lat == null || coords?.lon == null) {
      throw new Error('Location coordinates are missing.');
    }

    let url = `/api/ai/summary?lat=${coords.lat}&lon=${coords.lon}&scope=${scope}`;
    if (date) {
      url += `&date=${encodeURIComponent(date)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Unable to generate AI summary at this moment.');
    }

    const data = await response.json();
    return data.summary;
  };

  return (
    <WeatherContext.Provider
      value={{
        coords,
        weather,
        warnings,
        locationName,
        loading,
        error,
        requestLocation,
        searchLocation,
        fetchAiSummary
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);

  if (!context) {
    throw new Error('useWeather must be used inside a WeatherProvider');
  }

  return context;
}