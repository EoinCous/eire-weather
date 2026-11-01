import { lazy, Suspense } from 'react';
import WeatherDashboard from './pages/WeatherDashboard';
import DetailedDayForecast from './pages/DetailedDayForecast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WeatherProvider } from './context/WeatherContext';

const PrecipitationRadar = lazy(() => import('./pages/PrecipitationRadar'));

export default function App() {
  return (
    <WeatherProvider>
      <div className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-100 p-4 md:p-8">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WeatherDashboard />} />
            <Route path="/day/:dateKey" element={<DetailedDayForecast />} />
            <Route
              path="/precipitation-radar"
              element={
                <Suspense
                  fallback={
                    <div role="status" className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
                      Loading precipitation radar…
                    </div>
                  }
                >
                  <PrecipitationRadar />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </div>
    </WeatherProvider>
  );
}