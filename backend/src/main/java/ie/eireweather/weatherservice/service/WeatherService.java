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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class WeatherService {

    private final RestClient restClient;

    private static final String MET_EIREANN_API_URL = "http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat=%.4f;long=%.4f";
    private static final String USER_AGENT_VALUE = "EireWeatherApp/1.0";

    public WeatherService() {
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
        String rawUrl = String.format(Locale.US, MET_EIREANN_API_URL, lat, lon);

        MetEireannResponseDto raw = restClient.get()
            .uri(URI.create(rawUrl))
            .retrieve()
            .body(MetEireannResponseDto.class);

        return mapToWeatherResponse(raw, lat, lon);
    }

    private WeatherResponse mapToWeatherResponse(MetEireannResponseDto raw, double lat, double lon) {
        if (raw == null || raw.product() == null || raw.product().timeEntries() == null) {
            return new WeatherResponse(lat, lon, null, List.of());
        }

        Map<Instant, HourlyBuilder> forecastMap = new TreeMap<>();

        for (MetEireannResponseDto.TimeEntry entry : raw.product().timeEntries()) {
            // Grouping by "to" timestamp ensures both interval and instant entries merge on the hour
            Instant timestamp = Instant.parse(entry.to()); 
            MetEireannResponseDto.Location loc = entry.location();
            
            if (loc == null) continue;

            HourlyBuilder builder = forecastMap.computeIfAbsent(timestamp, k -> new HourlyBuilder(timestamp));

            if (entry.from().equals(entry.to())) {
                // Point-in-time metrics
                if (loc.temperature() != null) builder.temperature = loc.temperature().value();
                if (loc.windSpeed() != null) builder.windSpeedMps = loc.windSpeed().mps();
                if (loc.windDirection() != null) builder.windDirection = loc.windDirection().name();
                if (loc.humidity() != null) builder.humidityPercent = loc.humidity().value();
                if (loc.pressure() != null) builder.pressureHpa = loc.pressure().value();
            } else {
                // Interval metrics
                if (loc.precipitation() != null) builder.precipitationMm = loc.precipitation().value();
                if (loc.symbol() != null) {
                    builder.weatherSymbol = loc.symbol().id();
                    builder.weatherSymbolNumber = loc.symbol().number();
                }
            }
        }

        List<HourlyForecast> hourlyList = forecastMap.values().stream()
                .map(HourlyBuilder::build)
                .collect(Collectors.toList());

        HourlyForecast current = hourlyList.isEmpty() ? null : hourlyList.get(0);

        return new WeatherResponse(lat, lon, current, hourlyList);
    }

    // Mutable helper class during iteration
    private static class HourlyBuilder {
        private final Instant timestamp;
        private Double temperature;
        private Double precipitationMm;
        private String weatherSymbol;
        private Integer weatherSymbolNumber;
        private Double windSpeedMps;
        private String windDirection;
        private Double humidityPercent;
        private Double pressureHpa;

        HourlyBuilder(Instant timestamp) {
            this.timestamp = timestamp;
        }

        HourlyForecast build() {
            return new HourlyForecast(
                    timestamp, temperature, precipitationMm, weatherSymbol,
                    weatherSymbolNumber, windSpeedMps, windDirection, humidityPercent, pressureHpa
            );
        }
    }
}