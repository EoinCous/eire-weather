import { useState, useEffect } from 'react';

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

    Promise.all([
      fetch(`http://localhost:8080/api/v1/weather/forecast?lat=${coords.lat}&lon=${coords.lon}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch weather')),
      fetch(`http://localhost:8080/api/v1/weather/warnings`)
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
      setError(err);
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

  return { weather, warnings, locationName, loading, error, requestLocation };
}