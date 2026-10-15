package ie.eireweather.weatherservice.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import ie.eireweather.weatherservice.dto.HourlyForecast;
import ie.eireweather.weatherservice.dto.WeatherResponse;
import ie.eireweather.weatherservice.dto.xml.MetEireannResponseDto;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.CompletableFuture;

@Service
public class WeatherService {

    private final RestClient restClient;
    private final OpenMeteoService openMeteoService;

    private static final String MET_EIREANN_API_URL = "http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat=%.4f;long=%.4f";
    private static final String USER_AGENT_VALUE = "EireWeatherApp/1.0";

    public WeatherService(OpenMeteoService openMeteoService) {
        this.openMeteoService = openMeteoService;
        this.restClient = RestClient.builder()
            .requestFactory(new HttpComponentsClientHttpRequestFactory())
            .defaultHeader(HttpHeaders.USER_AGENT, USER_AGENT_VALUE)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_XML_VALUE)
            .requestInterceptor((request, body, execution) -> {
                request.getHeaders().remove(HttpHeaders.CONTENT_LENGTH);
                return execution.execute(request, body);
            })
            .build();
    }

    @Cacheable(value = "forecasts", key = "#lat + '-' + #lon")
    public WeatherResponse getForecast(double lat, double lon) {
        if (lat < -90.0 || lat > 90.0 || lon < -180.0 || lon > 180.0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90, and longitude between -180 and 180.");
        }
        
        String rawUrl = String.format(Locale.US, MET_EIREANN_API_URL, lat, lon);

        // Fetch Met Éireann and Open-Meteo data concurrently in parallel
        CompletableFuture<MetEireannResponseDto> metEireannFuture = CompletableFuture.supplyAsync(() -> 
            restClient.get()
                .uri(URI.create(rawUrl))
                .retrieve()
                .body(MetEireannResponseDto.class)
        );

        CompletableFuture<OpenMeteoService.OpenMeteoData> openMeteoFuture = 
            openMeteoService.getOpenMeteoDataAsync(lat, lon);

        // Wait for both futures to complete and map the final response
        return CompletableFuture.allOf(metEireannFuture, openMeteoFuture)
            .thenApply(v -> {
                MetEireannResponseDto raw = metEireannFuture.join();
                OpenMeteoService.OpenMeteoData openMeteoData = openMeteoFuture.join();

                return mapToWeatherResponse(raw, lat, lon, openMeteoData.uvMap(), openMeteoData.airQualityMap());
            }).join();
    }

    private WeatherResponse mapToWeatherResponse(
        MetEireannResponseDto raw, 
        double lat, 
        double lon, 
        Map<Instant, Double> uvMap, 
        Map<Instant, Double> airQualityMap
    ) {
        if (raw == null || raw.product() == null || raw.product().timeEntries() == null) {
            return new WeatherResponse(lat, lon, null, List.of());
        }

        Map<Instant, HourlyBuilder> forecastMap = new TreeMap<>();

        for (MetEireannResponseDto.TimeEntry entry : raw.product().timeEntries()) {
            Instant timestamp = Instant.parse(entry.to()); 
            MetEireannResponseDto.Location loc = entry.location();
            
            if (loc == null) continue;

            HourlyBuilder builder = forecastMap.computeIfAbsent(timestamp, k -> new HourlyBuilder(timestamp));

            if (entry.from().equals(entry.to())) {
                if (loc.cloudiness() != null) builder.cloudiness = loc.cloudiness().percent();
                if (loc.dewpointTemperature() != null) builder.dewpointTemperature = loc.dewpointTemperature().value();
                if (loc.temperature() != null) builder.temperature = loc.temperature().value();
                if (loc.windSpeed() != null) builder.windSpeedMps = loc.windSpeed().mps();
                if (loc.windDirection() != null) builder.windDirection = loc.windDirection().name();
                if (loc.humidity() != null) builder.humidityPercent = loc.humidity().value();
                if (loc.pressure() != null) builder.pressureHpa = loc.pressure().value();
            } else {
                if (loc.precipitation() != null) builder.precipitationMm = loc.precipitation().value();
                if (loc.symbol() != null) builder.weatherSymbol = loc.symbol().id();
            }
        }

        List<HourlyForecast> hourlyList = new ArrayList<>();

        for (HourlyBuilder builder : forecastMap.values()) {
            Double uv = uvMap.getOrDefault(builder.timestamp, 0.0);
            Double airQuality = airQualityMap.getOrDefault(builder.timestamp, 0.0);
            hourlyList.add(builder.build(uv, airQuality));
        }

        HourlyForecast current = hourlyList.isEmpty() ? null : hourlyList.get(0);

        return new WeatherResponse(lat, lon, current, hourlyList);
    }

    private static class HourlyBuilder {
        private final Instant timestamp;
        private Double cloudiness;
        private Double dewpointTemperature;
        private Double temperature;
        private Double precipitationMm;
        private String weatherSymbol;
        private Double windSpeedMps;
        private String windDirection;
        private Double humidityPercent;
        private Double pressureHpa;

        HourlyBuilder(Instant timestamp) {
            this.timestamp = timestamp;
        }

        HourlyForecast build(Double uvIndex, Double airQuality) {
            return new HourlyForecast(
                timestamp, cloudiness, dewpointTemperature, temperature, precipitationMm, weatherSymbol,
                windSpeedMps, windDirection, humidityPercent, pressureHpa, uvIndex, airQuality
            );
        }
    }
}