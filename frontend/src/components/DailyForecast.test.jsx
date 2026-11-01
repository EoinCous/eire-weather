import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DailyForecast from './DailyForecast';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../context/WeatherContext', () => ({
  useWeather: () => ({ fetchAiSummary: vi.fn() }),
}));

vi.mock('./WeatherIcon', () => ({
  WeatherIcon: ({ symbol }) => <span data-testid="weather-icon">{symbol}</span>,
}));

describe('DailyForecast Dublin calendar dates', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('groups and navigates by the Dublin date when UTC has already crossed midnight', () => {
    const hourlyForecasts = [
      {
        timestamp: '2026-06-01T23:30:00Z',
        temperatureC: 10,
        precipitationMm: 0.2,
        weatherSymbol: 'cloud',
      },
      {
        timestamp: '2026-06-02T00:30:00Z',
        temperatureC: 12,
        precipitationMm: 0.3,
        weatherSymbol: 'sun',
      },
    ];

    render(<DailyForecast hourlyForecasts={hourlyForecasts} />);
    fireEvent.click(screen.getByText('Today'));

    expect(navigateMock).toHaveBeenCalledWith('/day/2026-06-02', {
      state: {
        daySummary: expect.objectContaining({
          dateKey: '2026-06-02',
          minTemp: 10,
          maxTemp: 12,
          totalRain: 0.5,
        }),
        hourlyData: hourlyForecasts,
      },
    });
  });

  it.each([
    ['spring forward', '2026-03-29T00:30:00Z', '2026-03-29T01:30:00Z', '2026-03-29'],
    ['fall back', '2026-10-24T23:30:00Z', '2026-10-25T01:30:00Z', '2026-10-25'],
  ])('keeps hours together on the Dublin date during %s', (_transition, first, second, dayKey) => {
    const hourlyForecasts = [
      { timestamp: first, temperatureC: 8, precipitationMm: 0, weatherSymbol: 'cloud' },
      { timestamp: second, temperatureC: 9, precipitationMm: 0, weatherSymbol: 'rain' },
    ];

    render(<DailyForecast hourlyForecasts={hourlyForecasts} />);
    fireEvent.click(screen.getByText('Today'));

    expect(navigateMock).toHaveBeenCalledWith(
      `/day/${dayKey}`,
      expect.objectContaining({
        state: expect.objectContaining({ hourlyData: hourlyForecasts }),
      })
    );
  });

  it('chooses the representative symbol using Dublin local midday', () => {
    const hourlyForecasts = [
      { timestamp: '2026-03-29T00:30:00Z', temperatureC: 8, weatherSymbol: 'cloud' },
      { timestamp: '2026-03-29T12:00:00Z', temperatureC: 12, weatherSymbol: 'sun' },
    ];

    render(<DailyForecast hourlyForecasts={hourlyForecasts} />);
    fireEvent.click(screen.getByText('Today'));

    expect(navigateMock).toHaveBeenCalledWith(
      '/day/2026-03-29',
      expect.objectContaining({
        state: expect.objectContaining({
          daySummary: expect.objectContaining({ symbol: 'sun' }),
        }),
      })
    );
  });
});
