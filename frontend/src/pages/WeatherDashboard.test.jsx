import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WeatherDashboard from './WeatherDashboard';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  weather: null,
}));

vi.mock('../context/WeatherContext', () => ({
  useWeather: () => ({
    weather: mocks.weather,
    loading: false,
    error: null,
    requestLocation: vi.fn(),
    fetchAiSummary: vi.fn(),
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('../components/WeatherChart', () => ({
  default: ({ hourlyForecasts }) => (
    <output data-testid="weather-chart-hours">
      {hourlyForecasts.map(({ timestamp }) => timestamp).join(',')}
    </output>
  ),
}));
vi.mock('../components/DailyForecast', () => ({
  default: ({ hourlyForecasts }) => (
    <output data-testid="daily-forecast-hours">
      {hourlyForecasts.map(({ timestamp }) => timestamp).join(',')}
    </output>
  ),
}));
vi.mock('../components/WeatherWarnings', () => ({ default: () => null }));
vi.mock('../components/SunMoonInfo', () => ({ default: () => null }));
vi.mock('../components/PrecipitationRadarPreview', () => ({ default: () => null }));
vi.mock('../components/WeatherHeader', () => ({ default: () => null }));
vi.mock('../components/WeatherIcon', () => ({ WeatherIcon: () => null }));

describe('WeatherDashboard current conditions', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('switches to the already-fetched forecast at the next hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T14:59:00Z'));
    mocks.weather = {
      current: { temperatureC: 10 },
      hourlyForecasts: [
        { timestamp: '2026-01-01T13:00:00Z', temperatureC: 13 },
        { timestamp: '2026-01-01T14:00:00Z', temperatureC: 14 },
        { timestamp: '2026-01-01T15:00:00Z', temperatureC: 15 },
        { timestamp: '2026-01-01T16:00:00Z', temperatureC: 16 },
      ],
    };

    render(<WeatherDashboard />);
    expect(screen.getByText('14')).toBeTruthy();
    expect(screen.getByTestId('weather-chart-hours').textContent).toBe(
      '2026-01-01T14:00:00Z,2026-01-01T15:00:00Z,2026-01-01T16:00:00Z'
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByTestId('weather-chart-hours').textContent).toBe(
      '2026-01-01T15:00:00Z,2026-01-01T16:00:00Z'
    );
    expect(screen.getByTestId('daily-forecast-hours').textContent).toBe(
      '2026-01-01T15:00:00Z,2026-01-01T16:00:00Z'
    );
  });
});
