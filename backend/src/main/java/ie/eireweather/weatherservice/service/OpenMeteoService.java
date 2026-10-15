package ie.eireweather.weatherservice.service;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class OpenMeteoService {

    private final UvService uvService;
    private final AirQualityService airQualityService;

    public OpenMeteoService(UvService uvService, AirQualityService airQualityService) {
        this.uvService = uvService;
        this.airQualityService = airQualityService;
    }

    public record OpenMeteoData(
        Map<Instant, Double> uvMap,
        Map<Instant, Double> airQualityMap
    ) {}

    public CompletableFuture<OpenMeteoData> getOpenMeteoDataAsync(double lat, double lon) {
        CompletableFuture<Map<Instant, Double>> uvFuture = CompletableFuture.supplyAsync(() -> 
            uvService.getHourlyUvForecast(lat, lon)
        );

        CompletableFuture<Map<Instant, Double>> airQualityFuture = CompletableFuture.supplyAsync(() -> 
            airQualityService.getHourlyAqiForecast(lat, lon)
        );

        return CompletableFuture.allOf(uvFuture, airQualityFuture)
            .thenApply(v -> new OpenMeteoData(uvFuture.join(), airQualityFuture.join()));
    }
}