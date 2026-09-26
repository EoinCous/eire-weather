import { useState, useEffect, useCallback } from 'react';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://ec2-54-78-124-210.eu-west-1.compute.amazonaws.com:8080/api/v1/weather';

const SAVED_LOCATION_KEY = 'eireweather-location';

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [locationName, setLocationName] = useState('Locating...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [coords, setCoords] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_LOCATION_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          typeof parsed.lat === 'number' &&
          typeof parsed.lon === 'number'
        ) {
          return parsed;
        }
      }
    } catch {
      // Ignore invalid localStorage data
    }

    return null;
  });

  // Get location on first visit only
  useEffect(() => {
    if (coords) return;

    if (!navigator.geolocation) {
      // Fallback location
      setCoords({
        lat: 53.7374,
        lon: -7.9061,
      });

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        localStorage.setItem(
          SAVED_LOCATION_KEY,
          JSON.stringify(newCoords)
        );

        setCoords(newCoords);
      },
      () => {
        // User denied location permission
        setCoords({
          lat: 53.7374,
          lon: -7.9061,
        });
      }
    );
  }, [coords]);

  // Fetch weather whenever coordinates change
  useEffect(() => {
    if (!coords) return;

    let isMounted = true;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(
        `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}`
      ).then((res) =>
        res.ok
          ? res.json()
          : Promise.reject('Failed to fetch weather')
      ),

      fetch(`${BASE_URL}/warnings`)
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
    ])
      .then(([weatherData, warningsData]) => {
        if (!isMounted) return;

        setWeather(weatherData);
        setWarnings(
          Array.isArray(warningsData) ? warningsData : []
        );
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;

        setError(
          typeof err === 'string'
            ? err
            : 'Error loading weather data'
        );

        setLoading(false);
      });

    // Reverse geocoding
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;

        const name =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county;

        setLocationName(name || 'Unknown Location');
      })
      .catch(() => {
        if (!isMounted) return;

        setLocationName(
          `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`
        );
      });

    return () => {
      isMounted = false;
    };
  }, [coords]);

  // Explicitly request fresh location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        localStorage.setItem(
          SAVED_LOCATION_KEY,
          JSON.stringify(newCoords)
        );

        setCoords(newCoords);
      },
      () => {
        setError('Unable to determine your current location.');
        setLoading(false);
      }
    );
  };

  // Search for a location
  const searchLocation = async (query) => {
    if (!query || !query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=1`
      );

      const data = await res.json();

      if (data && data.length > 0) {
        const firstResult = data[0];

        const newCoords = {
          lat: parseFloat(firstResult.lat),
          lon: parseFloat(firstResult.lon),
        };

        localStorage.setItem(
          SAVED_LOCATION_KEY,
          JSON.stringify(newCoords)
        );

        setCoords(newCoords);
      } else {
        setError(`No location found for "${query}"`);
        setLoading(false);
      }
    } catch {
      setError('Failed to search location. Please try again.');
      setLoading(false);
    }
  };

  return {
    coords,
    weather,
    warnings,
    locationName,
    loading,
    error,
    requestLocation,
    searchLocation,
  };
}