import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather, WeatherProvider } from './WeatherContext';

const SAVED_LOCATION_KEY = 'eireweather-location';
const savedLocation = { lat: 53.3498, lon: -6.2603, name: 'Dublin, Co. Dublin' };
const forecast = { current: { temperature: 12 } };
const warnings = [{ headline: 'Yellow rain warning' }];

function response(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

function renderWeather() {
  return renderHook(() => useWeather(), { wrapper: WeatherProvider });
}

describe('WeatherProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(savedLocation));

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (url.includes('/forecast?')) return response(forecast);
        if (url.endsWith('/warnings')) return response(warnings);
        if (url.includes('/reverse?')) {
          return response({
            address: { town: 'Dublin', county: 'Dublin' },
            display_name: 'Dublin, Ireland',
          });
        }
        if (url.startsWith('/api/ai/summary')) {
          return response({ summary: 'A mild day.' });
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((_success, failure) => {
          failure(new Error('Permission denied'));
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('loads the saved location, forecast, and warnings without requesting geolocation', async () => {
    const { result } = renderWeather();

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.warnings).toEqual(warnings));

    expect(result.current.coords).toEqual({ lat: savedLocation.lat, lon: savedLocation.lon });
    expect(result.current.locationName).toBe(savedLocation.name);
    expect(result.current.weather).toEqual(forecast);
    expect(result.current.warnings).toEqual(warnings);
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid saved coordinates and falls back when geolocation fails', async () => {
    localStorage.setItem(
      SAVED_LOCATION_KEY,
      JSON.stringify({ lat: 500, lon: -6, name: 'Invalid place' })
    );

    const { result } = renderWeather();

    await waitFor(() => expect(result.current.coords).toEqual({ lat: 53.7374, lon: -7.9061 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledOnce();
    expect(result.current.weather).toEqual(forecast);
  });

  it('finds an Irish result, formats its name, and persists parsed coordinates', async () => {
    fetch.mockImplementation(async (url) => {
      if (url.includes('/search?')) {
        return response([
          {
            lat: '55.9533',
            lon: '-3.1883',
            address: { country_code: 'gb', county: 'City of Edinburgh' },
          },
          {
            lat: '53.293',
            lon: '-6.134',
            address: { country_code: 'ie', town: 'Dún Laoghaire', county: 'Dublin' },
          },
        ]);
      }

      if (url.includes('/forecast?')) return response(forecast);
      if (url.endsWith('/warnings')) return response(warnings);
      throw new Error(`Unexpected request: ${url}`);
    });
    const { result } = renderWeather();

    await act(async () => {
      await result.current.searchLocation('  Dún Laoghaire  ');
    });

    expect(fetch.mock.calls[2][0]).toContain('q=D%C3%BAn%20Laoghaire');
    expect(result.current.coords).toEqual({ lat: 53.293, lon: -6.134 });
    expect(result.current.locationName).toBe('Dún Laoghaire, Co. Dublin');
    expect(JSON.parse(localStorage.getItem(SAVED_LOCATION_KEY))).toEqual({
      lat: 53.293,
      lon: -6.134,
      name: 'Dún Laoghaire, Co. Dublin',
    });
  });

  it('accepts Northern Ireland results and ignores invalid Irish coordinates', async () => {
    fetch.mockImplementation(async (url) => {
      if (url.includes('/search?')) {
        return response([
          {
            lat: '95',
            lon: '-6',
            address: { country_code: 'ie', town: 'Invalid' },
          },
          {
            lat: '54.5973',
            lon: '-5.9301',
            address: { country_code: 'gb', city: 'Belfast', county: 'County Antrim' },
          },
        ]);
      }

      if (url.includes('/forecast?')) return response(forecast);
      if (url.endsWith('/warnings')) return response(warnings);
      throw new Error(`Unexpected request: ${url}`);
    });
    const { result } = renderWeather();

    await act(async () => {
      await result.current.searchLocation('Belfast');
    });

    expect(result.current.coords).toEqual({ lat: 54.5973, lon: -5.9301 });
    expect(result.current.locationName).toBe('Belfast, County Antrim');
  });

  it('does not replace the current location when search finds no valid Irish match', async () => {
    fetch.mockImplementation(async (url) => {
      if (url.includes('/search?')) {
        return response([
          {
            lat: '55.9533',
            lon: '-3.1883',
            address: { country_code: 'gb', county: 'City of Edinburgh' },
          },
        ]);
      }

      if (url.includes('/forecast?')) return response(forecast);
      if (url.endsWith('/warnings')) return response(warnings);
      throw new Error(`Unexpected request: ${url}`);
    });
    const { result } = renderWeather();

    await expect(result.current.searchLocation('Edinburgh')).rejects.toThrow(
      'Couldn’t find “Edinburgh” in Ireland.'
    );

    expect(result.current.coords).toEqual({ lat: savedLocation.lat, lon: savedLocation.lon });
    expect(JSON.parse(localStorage.getItem(SAVED_LOCATION_KEY))).toEqual(savedLocation);
  });

  it('ignores blank searches and reports unavailable search requests', async () => {
    const { result } = renderWeather();
    const initialRequestCount = fetch.mock.calls.length;

    await act(async () => {
      await result.current.searchLocation('   ');
    });
    expect(fetch).toHaveBeenCalledTimes(initialRequestCount);

    fetch.mockRejectedValueOnce(new Error('Network unavailable'));
    await expect(result.current.searchLocation('Galway')).rejects.toThrow(
      'Search is unavailable right now. Please try again.'
    );
  });

  it('requests current location and stores valid coordinates', async () => {
    navigator.geolocation.getCurrentPosition.mockImplementationOnce((success) => {
      success({ coords: { latitude: 52.6638, longitude: -8.6267 } });
    });
    fetch.mockImplementation(async (url) => {
      if (url.includes('/reverse?')) {
        return response({
          address: { city: 'Limerick', county: 'Limerick' },
          display_name: 'Limerick, Ireland',
        });
      }
      if (url.includes('/forecast?')) return response(forecast);
      if (url.endsWith('/warnings')) return response(warnings);
      throw new Error(`Unexpected request: ${url}`);
    });
    const { result } = renderWeather();

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.requestLocation();
    });

    expect(result.current.coords).toEqual({ lat: 52.6638, lon: -8.6267 });
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(SAVED_LOCATION_KEY))).toEqual({
        lat: 52.6638,
        lon: -8.6267,
        name: 'Limerick, Co. Limerick',
      })
    );
  });

  it('throws on location failure when requested by the search UI', async () => {
    const { result } = renderWeather();

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.requestLocation({ throwOnError: true })).rejects.toThrow(
      'Unable to determine your current location.'
    );

    expect(result.current.coords).toEqual({ lat: savedLocation.lat, lon: savedLocation.lon });
    expect(result.current.loading).toBe(false);
  });

  it('fetches AI summaries with optional encoded dates and reports failures', async () => {
    const { result } = renderWeather();
    const summary = await result.current.fetchAiSummary('SINGLE_DAY', '2026-11-01&other=value');

    expect(summary).toBe('A mild day.');
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/ai/summary?lat=53.3498&lon=-6.2603&scope=SINGLE_DAY&date=2026-11-01%26other%3Dvalue'
    );

    fetch.mockResolvedValueOnce(response({}, false, 500));
    await expect(result.current.fetchAiSummary()).rejects.toThrow(
      'Unable to generate AI summary at this moment.'
    );
  });

  it('keeps warnings empty when the warnings endpoint returns a non-array payload', async () => {
    fetch.mockImplementation(async (url) => {
      if (url.endsWith('/warnings')) return response({ warning: 'unexpected shape' });
      if (url.includes('/forecast?')) return response(forecast);
      throw new Error(`Unexpected request: ${url}`);
    });
    const { result } = renderWeather();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.warnings).toEqual([]);
  });

  it('exposes forecast request failures without preventing warnings from loading', async () => {
    fetch.mockImplementation(async (url) => {
      if (url.includes('/forecast?')) return response({}, false, 503);
      if (url.endsWith('/warnings')) return response(warnings);
      throw new Error(`Unexpected request: ${url}`);
    });
    const { result } = renderWeather();

    await waitFor(() => expect(result.current.error).toBe('Failed to fetch weather'));
    await waitFor(() => expect(result.current.warnings).toEqual(warnings));

    expect(result.current.loading).toBe(false);
    expect(result.current.weather).toBeNull();
  });
});
