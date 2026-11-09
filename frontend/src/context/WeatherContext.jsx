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

function isValidCoordinates(lat, lon) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function parseCoordinate(value) {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function getPositionCoordinates(position) {
  const { latitude, longitude } = position?.coords ?? {};

  if (!isValidCoordinates(latitude, longitude)) {
    throw new Error('Geolocation returned invalid coordinates.');
  }

  return { latitude, longitude };
}

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
      !parsed ||
      typeof parsed !== 'object' ||
      !isValidCoordinates(parsed.lat, parsed.lon)
    ) {
      return null;
    }

    return {
      lat: parsed.lat,
      lon: parsed.lon,
      name: typeof parsed.name === 'string' ? parsed.name : null,
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
        /*
         * Forecasts are on a grid of roughly a kilometre, so a coarse
         * (wifi / network) fix is plenty. High accuracy forces a GPS
         * lock on phones, which is slower and uses more battery.
         */
        enableHighAccuracy: false,
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

  const locality =
    address?.town ||
    address?.city ||
    address?.village ||
    address?.hamlet ||
    address?.region ||
    address?.municipality ||
    address?.suburb ||
    address?.neighbourhood ||
    address?.road;

  let county = typeof address?.county === 'string' ? address.county : '';

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

/*
 * `includes` already matches "county antrim" and friends,
 * so the short names are enough.
 */
const NI_COUNTIES = [
  'antrim',
  'armagh',
  'down',
  'fermanagh',
  'londonderry',
  'derry',
  'tyrone',
];

/* Republic of Ireland, or Northern Ireland within the UK results */
function isIrishResult(item) {
  const address = item?.address;
  const countryCode =
    typeof address?.country_code === 'string'
      ? address.country_code.toLowerCase()
      : '';
  const county =
    typeof address?.county === 'string'
      ? address.county.toLowerCase()
      : '';
  const state =
    typeof address?.state === 'string'
      ? address.state.toLowerCase()
      : '';

  if (countryCode === 'ie') {
    return true;
  }

  if (countryCode === 'gb' || countryCode === 'uk') {
    return (
      state.includes('northern ireland') ||
      NI_COUNTIES.some((niCounty) => county.includes(niCounty))
    );
  }

  return false;
}

export function WeatherProvider({ children }) {
  /*
   * Read the saved location synchronously, once.
   *
   * This means a returning user immediately has coordinates
   * available without waiting for browser geolocation.
   * (Lazy initial state, so localStorage isn't parsed on every render.)
   */
  const [savedLocation] = useState(getSavedLocation);

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
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshController = useRef(null);

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
        const { latitude, longitude } = getPositionCoordinates(position);

        const newLocation = {
          lat: latitude,
          lon: longitude,
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
        setCoords({
          lat: FALLBACK_COORDS.lat,
          lon: FALLBACK_COORDS.lon,
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

        if (!controller.signal.aborted) {
          setWeather(data);
          setLastUpdated(new Date().toISOString());
        }
      } catch (err) {
        if (controller.signal.aborted || err?.name === 'AbortError') {
          return;
        }

        setError(
          err?.message ||
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
      refreshController.current?.abort();
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
        if (controller.signal.aborted || err?.name === 'AbortError') {
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
        if (controller.signal.aborted || err?.name === 'AbortError') {
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

  /* =======================================================
     Location actions

     Both THROW on failure when the caller asks for it, so the
     search bar can show the problem inline while the current
     forecast stays on screen.
  ======================================================== */

  const requestLocation = async ({ throwOnError = false } = {}) => {
    let coordinates;

    // Don't flip `loading` yet: the page shouldn't go blank while the browser
    // is showing its permission prompt.
    try {
      const position = await getCurrentPosition();
      coordinates = getPositionCoordinates(position);
    } catch {
      const message = 'Unable to determine your current location. Check your browser’s location permission.';

      // Called from the search bar: report inline and keep the current forecast
      if (throwOnError) throw new Error(message);

      // Called from the error screen: nothing to show, so use the global error
      setError(message);
      setLoading(false);
      return;
    }

    const newLocation = {
      lat: coordinates.latitude,
      lon: coordinates.longitude,
      name: null,
    };

    saveLocation(newLocation);

    setError(null);
    setLoading(true);
    setLocationName('Locating...');
    setCoords({ lat: newLocation.lat, lon: newLocation.lon });
  };

  const searchLocation = async (query) => {
    const trimmed = query?.trim();

    if (!trimmed) {
      return;
    }

    let results;

    try {
      // Restrict Nominatim to IE and GB, then filter GB down to Northern Ireland.
      // limit=10 so non-NI UK matches can't push every Irish match out of the list.
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ie,gb&q=${encodeURIComponent(
          trimmed
        )}&limit=10`
      );

      if (!response.ok) {
        throw new Error(`Nominatim responded with ${response.status}`);
      }

      results = await response.json();
      if (!Array.isArray(results)) {
        throw new Error('Nominatim returned an invalid response');
      }
    } catch {
      throw new Error('Search is unavailable right now. Please try again.');
    }

    const match = results.find((item) => {
      if (!isIrishResult(item)) {
        return false;
      }

      return isValidCoordinates(
        parseCoordinate(item.lat),
        parseCoordinate(item.lon)
      );
    });

    if (!match) {
      throw new Error(`Couldn’t find “${trimmed}” in Ireland.`);
    }

    // 2) Only now that the location is valid do we replace the forecast
    const newLocation = {
      lat: parseCoordinate(match.lat),
      lon: parseCoordinate(match.lon),
      name: getLocationName(match.address, match.display_name),
    };

    saveLocation(newLocation);

    setError(null);
    setLoading(true);
    setLocationName(newLocation.name);
    setCoords({
      lat: newLocation.lat,
      lon: newLocation.lon,
    });
  };

  const refreshWeather = async () => {
    if (coords?.lat == null || coords?.lon == null) {
      throw new Error('Location coordinates are missing.');
    }

    refreshController.current?.abort();
    const controller = new AbortController();
    refreshController.current = controller;
    setRefreshing(true);

    try {
      const response = await fetch(
        `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&refresh=true`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error('Failed to update weather');
      }

      const data = await response.json();
      if (!controller.signal.aborted) {
        setWeather(data);
        setLastUpdated(new Date().toISOString());
      }
    } finally {
      if (refreshController.current === controller) {
        refreshController.current = null;
        setRefreshing(false);
      }
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
        lastUpdated,
        refreshing,
        warnings,
        locationName,
        loading,
        error,
        requestLocation,
        refreshWeather,
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