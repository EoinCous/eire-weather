package ie.eireweather.weatherservice.service;

import ie.eireweather.weatherservice.dto.WeatherResponse;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

@Service
public class WeatherCacheService {

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final LongSupplier currentTimeMillis;
    private static final long EXPIRATION_TIME_MS = 30 * 60 * 1000; // 30 minutes

    public WeatherCacheService() {
        this(System::currentTimeMillis);
    }

    WeatherCacheService(LongSupplier currentTimeMillis) {
        this.currentTimeMillis = currentTimeMillis;
    }

    public void putWeatherData(String cacheKey, WeatherResponse response) {
        cache.put(cacheKey, new CacheEntry(response, currentTimeMillis.getAsLong()));
    }

    public WeatherResponse getWeatherData(String cacheKey) {
        CacheEntry entry = cache.get(cacheKey);
        if (entry == null) {
            return null;
        }

        if (currentTimeMillis.getAsLong() - entry.timestamp > EXPIRATION_TIME_MS) {
            cache.remove(cacheKey);
            return null;
        }

        return entry.response;
    }

    private record CacheEntry(WeatherResponse response, long timestamp) {}
}