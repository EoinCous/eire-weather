import WeatherDashboard from './pages/WeatherDashboard';
import DetailedDayForecast from './pages/DetailedDayForecast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-100 p-4 md:p-8">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WeatherDashboard />} />
          <Route path="/day/:dateKey" element={<DetailedDayForecast />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}