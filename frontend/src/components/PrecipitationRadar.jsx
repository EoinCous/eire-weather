import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function PrecipitationRadar() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const radarLayersRef = useRef({});

  const [frames, setFrames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Initialize Leaflet Map
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
      }).setView([53.4129, -8.2439], 6);

      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 12,
        minZoom: 6,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
      }).addTo(mapInstanceRef.current);
    }

    // 2. Fetch RainViewer Frames
    async function loadRadarFrames() {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();

        if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
          const host = data.host;
          // Take the last 8 frames (~2 hours of history)
          const pastFrames = data.radar.past.slice(-8);

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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Handle Active Frame Visibility (Only show opacity for the current index)
  useEffect(() => {
    if (frames.length === 0) return;

    frames.forEach((frame, idx) => {
      const layer = radarLayersRef.current[frame.time];
      if (layer) {
        layer.setOpacity(idx === currentIndex ? 0.75 : 0);
      }
    });
  }, [currentIndex, frames]);

  // 4. Playback Timer Loop
  useEffect(() => {
    let interval = null;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % frames.length);
      }, 600); // Advances frame every 600ms
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
          Precipitation Radar
        </h3>
        {activeTime && (
          <span className="text-xs bg-slate-800 text-cyan-400 px-2.5 py-1 rounded-full font-medium">
            {activeTime} {currentIndex === frames.length - 1 && !isPlaying ? '(Latest)' : ''}
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

      {/* Animation Controls */}
      {!loading && frames.length > 0 && (
        <div className="mt-3 flex items-center gap-3 bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Timeline Step Dots */}
          <div className="flex-1 flex items-center justify-between gap-1.5 px-2">
            {frames.map((frame, idx) => (
              <button
                key={frame.time}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all flex-1 ${
                  idx === currentIndex
                    ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={formatTime(frame.time)}
              />
            ))}
          </div>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentIndex(frames.length - 1);
            }}
            className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset to latest"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}
    </div>
  );
}