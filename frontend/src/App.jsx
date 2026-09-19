import WeatherDashboard from './pages/WeatherDashboard';
import DetailedDayForecast from './pages/DetailedDayForecast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WeatherDashboard />} />
        <Route path="/day/:dateKey" element={<DetailedDayForecast />} />
      </Routes>
    </BrowserRouter>
    
  );
}