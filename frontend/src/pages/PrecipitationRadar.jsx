import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';

export default function PrecipitationRadar() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const radarLayersRef = useRef({});

  const [frames, setFrames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Initialize Fullscreen Map & Load RainViewer Frames with Caching
  useEffect(() => {
    if (!mapInstanceRef.current) {
      const irelandBounds = L.latLngBounds(
        L.latLng(51.0, -11.0),
        L.latLng(55.8, -5.0)
      );

      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        maxBounds: irelandBounds,
        maxBoundsViscosity: 0.8,
      }).setView([53.4129, -8.2439], 7);

      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 12,
        minZoom: 6,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
      }).addTo(mapInstanceRef.current);
    }

    async function loadRadarFrames() {
      try {
        const CACHE_KEY = 'eire_weather_rainviewer_cache';
        const CACHE_TIME_KEY = 'eire_weather_rainviewer_time';
        const FIVE_MINUTES = 5 * 60 * 1000;

        let data = null;
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);

        // Use cache if less than 5 minutes old
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
          // (2 hours of history)
          const pastFrames = data.radar.past;

          // Clear out any existing radar layers to prevent ghosting/stacking
          Object.values(radarLayersRef.current).forEach((layer) => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(layer);
            }
          });
          radarLayersRef.current = {};

          // Pre-create tile layers using each frame's *own* unique path
          pastFrames.forEach((frame) => {
            const radarUrl = `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
            const layer = L.tileLayer(radarUrl, {
              opacity: 0, // Initially invisible
              minZoom: 6,
              maxZoom: 12,
              maxNativeZoom: 7,
            });
            layer.addTo(mapInstanceRef.current);
            radarLayersRef.current[frame.time] = layer;
          });

          setFrames(pastFrames);
          // Start focused on the newest frame
          setCurrentIndex(pastFrames.length - 1);
        }
      } catch (error) {
        console.error('Failed to load radar timeline:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRadarFrames();

    return () => {
      // Cleanup layers and map on unmount
      Object.values(radarLayersRef.current).forEach((layer) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      radarLayersRef.current = {};

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle Active Frame Visibility (Only show opacity for the current index)
  useEffect(() => {
    if (frames.length === 0) return;

    frames.forEach((frame, idx) => {
      const layer = radarLayersRef.current[frame.time];
      if (layer) {
        layer.setOpacity(idx === currentIndex ? 0.75 : 0);
      }
    });
  }, [currentIndex, frames]);

  // 3. Playback Timer Loop
  useEffect(() => {
    let interval = null;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % frames.length);
      }, 400); // Advances frame every 600ms
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeTime = frames[currentIndex] ? formatTime(frames[currentIndex].time) : '';

  return (
    <div className="fixed inset-0 z-50 w-full h-[100dvh] bg-slate-950 overflow-hidden">
      {/* Floating Header with Safe Area Top Offset */}
      <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 right-4 z-[1000] flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
          Precipitation Radar
        </h2>

        {activeTime ? (
          <span className="text-xs bg-slate-800 text-cyan-400 px-2.5 py-1 rounded-full font-medium">
            {activeTime}
          </span>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* Fullscreen Map Canvas */}
      <div ref={mapRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-[2000] text-slate-400 text-sm">
          Loading radar map...
        </div>
      )}

      {/* Floating Bottom Animation Scrubber Bar with Safe Area Bottom Offset */}
      {!loading && frames.length > 0 && (
        <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-4 right-4 max-w-lg mx-auto z-[1000] bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Clickable Progress Timeline Bar */}
          <div 
            className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              const targetIdx = Math.floor(percentage * frames.length);
              setIsPlaying(false);
              setCurrentIndex(Math.min(Math.max(targetIdx, 0), frames.length - 1));
            }}
          >
            <div 
              className="h-full bg-cyan-400 transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / frames.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}