import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function PrecipitationRadar() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [radarTime, setRadarTime] = useState('');

  useEffect(() => {
    // 1. Initialize Map centered over Ireland (Dublin/Midlands focus)
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([53.4129, -8.2439], 7); // Center of Ireland

      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 12,
        minZoom: 5,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);
    }

    // 2. Fetch RainViewer Timeline & Add Radar Overlay
    async function loadRadarData() {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();

        if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
          const host = data.host;
          // Get the most recent past radar frame
          const latestFrame = data.radar.past[data.radar.past.length - 1];
          
          // Format timestamp for display
          const date = new Date(latestFrame.time * 1000);
          setRadarTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          // Remove previous tile layer if updating
          if (tileLayerRef.current) {
            mapInstanceRef.current.removeLayer(tileLayerRef.current);
          }

          // RainViewer tile URL pattern: {host}{path}/256/{z}/{x}/{y}/2/1_1.png
          // color scheme #2 with smooth interpolation
          const radarUrl = `${host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

          tileLayerRef.current = L.tileLayer(radarUrl, {
            opacity: 0.75,
            maxZoom: 12,
          }).addTo(mapInstanceRef.current);
        }
      } catch (error) {
        console.error('Failed to load precipitation radar:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRadarData();

    // Cleanup map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
          Live Precipitation Radar
        </h3>
        {radarTime && (
          <span className="text-xs bg-slate-800 text-cyan-400 px-2.5 py-1 rounded-full font-medium">
            Latest: {radarTime}
          </span>
        )}
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-72 rounded-xl overflow-hidden border border-slate-800/80 relative z-10"
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