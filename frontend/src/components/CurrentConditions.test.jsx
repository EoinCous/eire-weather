import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentConditions from './CurrentConditions';

vi.mock('../context/WeatherContext', () => ({
  useWeather: () => ({ fetchAiSummary: vi.fn() }),
}));

vi.mock('./WeatherIcon', () => ({
  WeatherIcon: () => null,
}));

describe('CurrentConditions precipitation', () => {
  afterEach(cleanup);

  it('shows the expected hourly amount, range, and probability', () => {
    render(
      <CurrentConditions
        current={{
          precipitationMm: 0.1,
          precipitationMinMm: 0,
          precipitationMaxMm: 3.6,
          precipitationProbability: 44.5,
        }}
      />
    );

    expect(screen.getByText('0.1 mm')).toBeTruthy();
    expect(screen.getByText('This hour · range 0.0–3.6 mm · 45% chance')).toBeTruthy();
  });

  it('keeps the hourly detail useful when optional precipitation attributes are missing', () => {
    render(<CurrentConditions current={{ precipitationMm: 0 }} />);

    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.getByText('This hour')).toBeTruthy();
  });

  it('hides range and probability when there is no measurable rain', () => {
    render(
      <CurrentConditions
        current={{
          precipitationMm: 0,
          precipitationMinMm: 0,
          precipitationMaxMm: 3.6,
          precipitationProbability: 44.5,
        }}
      />
    );

    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.getByText('This hour')).toBeTruthy();
    expect(screen.queryByText(/range|chance/)).toBeNull();
  });
});
