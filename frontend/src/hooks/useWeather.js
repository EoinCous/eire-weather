import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/weather';

export function useWeather(defaultLat = 53.7374, defaultLon = -7.9061) {
  const [weather, setWeather] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [locationName, setLocationName] = useState('Locating...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState({ lat: defaultLat, lon: defaultLon });
 
  useEffect(() => {
    
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch weather')),
      fetch(`${BASE_URL}/warnings`)
        .then(res => res.ok ? res.json() : [])
        .catch(() => [])
    ])
    .then(([weatherData, warningsData]) => {
      if (!isMounted) return;
      setWeather(weatherData);
      setWarnings(Array.isArray(warningsData) ? warningsData : []);
      setLoading(false);
    })
    .catch(err => {
      if (!isMounted) return;
      setError(typeof err === 'string' ? err : 'Error loading weather data');
      setLoading(false);
    });

    // Reverse Geocoding
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        const name = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
        setLocationName(name || 'Unknown Location');
      })
      .catch(() => setLocationName(`${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`));

    return () => { isMounted = false; };
  }, [coords.lat, coords.lon]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      });
    }
  };

  // Forward Geocoding: Search place name -> [lat, lon]
  const searchLocation = async (query) => {
    if (!query || !query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const firstResult = data[0];
        setCoords({
          lat: parseFloat(firstResult.lat),
          lon: parseFloat(firstResult.lon),
        });
      } else {
        setError(`No coordinates found for "${query}"`);
        setLoading(false);
      }
    } catch {
      setError('Failed to search location. Please try again.');
      setLoading(false);
    }
  };

  return { coords, weather, warnings, locationName, loading, error, requestLocation, searchLocation };
}