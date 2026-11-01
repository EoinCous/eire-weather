package ie.eireweather.weatherservice.service;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.Test;

import ie.eireweather.weatherservice.dto.WeatherResponse;

class WeatherCacheServiceTest {

    private static final long THIRTY_MINUTES_MS = 30 * 60 * 1000;

    @Test
    void getWeatherDataReturnsNullForMissingKey() {
        WeatherCacheService cacheService = new WeatherCacheService(() -> 0L);

        assertNull(cacheService.getWeatherData("missing"));
    }

    @Test
    void putWeatherDataStoresAndReplacesTheResponseForKey() {
        WeatherCacheService cacheService = new WeatherCacheService(() -> 0L);
        WeatherResponse firstResponse = response(53.0);
        WeatherResponse replacementResponse = response(54.0);

        cacheService.putWeatherData("dublin", firstResponse);
        assertSame(firstResponse, cacheService.getWeatherData("dublin"));

        cacheService.putWeatherData("dublin", replacementResponse);

        assertSame(replacementResponse, cacheService.getWeatherData("dublin"));
    }

    @Test
    void getWeatherDataExpiresAndRemovesEntriesAfterThirtyMinutes() {
        AtomicLong currentTimeMillis = new AtomicLong();
        WeatherCacheService cacheService = new WeatherCacheService(currentTimeMillis::get);
        WeatherResponse response = response(53.0);
        cacheService.putWeatherData("dublin", response);

        currentTimeMillis.set(THIRTY_MINUTES_MS);
        assertSame(response, cacheService.getWeatherData("dublin"));

        currentTimeMillis.incrementAndGet();

        assertNull(cacheService.getWeatherData("dublin"));
        assertNull(cacheService.getWeatherData("dublin"));
    }

    private WeatherResponse response(double latitude) {
        return new WeatherResponse(latitude, -6.0, null, List.of());
    }
}
