import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Maximize2 } from 'lucide-react';

export default function PrecipitationRadarPreview() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [radarTime, setRadarTime] = useState('');

  useEffect(() => {
    // 1. Initialize Non-Interactive Preview Map
    if (!mapInstanceRef.current) {
      const irelandBounds = L.latLngBounds(
        L.latLng(51.0, -11.0),
        L.latLng(55.8, -5.0)
      );

      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        maxBounds: irelandBounds,
      }).setView([53.4129, -8.2439], 6);

      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 12,
        minZoom: 6,
        attribution: '&copy; Stadia Maps'
      }).addTo(mapInstanceRef.current);
    }

    // 2. Fetch Latest RainViewer Frame with sessionStorage Caching
    async function loadLatestFrame() {
      try {
        const CACHE_KEY = 'eire_weather_rainviewer_cache';
        const CACHE_TIME_KEY = 'eire_weather_rainviewer_time';
        const FIVE_MINUTES = 5 * 60 * 1000;

        let data = null;
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);

        // Use cached manifest if less than 5 minutes old
        if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime) < FIVE_MINUTES)) {
          data = JSON.parse(cachedData);
        } else {
          const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
          data = await response.json();
          
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }

        if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
          const host = data.host;
          const latestFrame = data.radar.past[data.radar.past.length - 1];

          const date = new Date(latestFrame.time * 1000);
          setRadarTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          if (tileLayerRef.current) {
            mapInstanceRef.current.removeLayer(tileLayerRef.current);
          }

          const radarUrl = `${host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

          tileLayerRef.current = L.tileLayer(radarUrl, {
            opacity: 0.75,
            minZoom: 6,
            maxZoom: 12,
            maxNativeZoom: 7,
          }).addTo(mapInstanceRef.current);
        }
      } catch (error) {
        console.error('Failed to load radar preview:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLatestFrame();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      onClick={() => navigate('/precipitation-radar')}
      className="group cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase flex items-center gap-2">
          Precipitation Radar
        </h3>
        {radarTime && (
          <span className="text-xs bg-slate-800 text-cyan-400 px-2.5 py-1 rounded-full font-medium">
            Latest: {radarTime}
          </span>
        )}
      </div>

      {/* Map Container with Hover Badge Overlay */}
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-xl overflow-hidden border border-slate-800/80 relative z-10"
      >
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-20 text-slate-400 text-sm">
            Loading radar map...
          </div>
        )}
      </div>
    </div>
  );
}