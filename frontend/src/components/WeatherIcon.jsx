import { 
  Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning
} from 'lucide-react';

// Helper to map Met Éireann symbol codes to Lucide React SVG components
export const WeatherIcon = ({ symbol, className = "w-8 h-8", strokeWidth = 2 }) => {
  if (!symbol) return <Cloud className={className} strokeWidth={strokeWidth} />;
  const s = symbol.toLowerCase();
  
  if (s.includes('thunder')) return <CloudLightning className={className} strokeWidth={strokeWidth} />;
  if (s.includes('snow') || s.includes('sleet')) return <CloudSnow className={className} strokeWidth={strokeWidth} />;
  if (s.includes('rain') || s.includes('drizzle') || s.includes('shower')) return <CloudRain className={className} strokeWidth={strokeWidth} />;
  if (s.includes('fog') || s.includes('mist')) return <CloudFog className={className} strokeWidth={strokeWidth} />;
  if (s.includes('cloud') && s.includes('sun')) return <CloudSun className={className} strokeWidth={strokeWidth} />;
  if (s.includes('sun') || s.includes('clear')) return <Sun className={className} strokeWidth={strokeWidth} />;
  if (s.includes('cloud')) return <Cloud className={className} strokeWidth={strokeWidth} />;
  
  return <CloudSun className={className} strokeWidth={strokeWidth} />;
};