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

function getLocationName(address) {
  return (
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    address?.county ||
    'Unknown Location'
  );
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

  return getLocationName(data.address);
}

/* =========================================================
   Provider
========================================================= */

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

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query.trim()
        )}&limit=1`
      );

      if (!response.ok) {
        throw new Error(
          'Failed to search location'
        );
      }

      const data = await response.json();

      if (!data?.length) {
        setError(
          `No location found for "${query}"`
        );

        setLoading(false);
        return;
      }

      const result = data[0];

      const newLocation = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        name: getLocationName(
          result.address
        ),
      };

      saveLocation(newLocation);

      setLocationName(
        newLocation.name
      );

      setCoords({
        lat: newLocation.lat,
        lon: newLocation.lon,
      });
    } catch (err) {
      setError(
        err.message ||
          'Failed to search location. Please try again.'
      );

      setLoading(false);
    }
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