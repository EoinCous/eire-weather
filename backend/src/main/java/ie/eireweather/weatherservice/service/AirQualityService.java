package ie.eireweather.weatherservice.service;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import ie.eireweather.weatherservice.dto.openmeteo.AirQualityResponse;

@Service
public class AirQualityService {

    private final RestClient restClient;

    public AirQualityService() {
        this.restClient = RestClient.create("https://air-quality-api.open-meteo.com");
    }

    public Map<Instant, Double> getHourlyAqiForecast(double lat, double lon) {
        try {
            AirQualityResponse response = restClient.get()
                .uri("/v1/air-quality?latitude={lat}&longitude={lon}&hourly=european_aqi,pm2_5,pm10&forecast_days=7&timezone=auto", lat, lon)
                .retrieve()
                .body(AirQualityResponse.class);

            if (response != null && response.hourly() != null 
                    && response.hourly().time() != null 
                    && response.hourly().europeanAqi() != null) {

                List<String> times = response.hourly().time();
                List<Double> aqiValues = response.hourly().europeanAqi();

                Map<Instant, Double> aqiMap = new HashMap<>();

                for (int i = 0; i < Math.min(times.size(), aqiValues.size()); i++) {
                    String timeStr = times.get(i);
                    Double aqi = aqiValues.get(i);

                    Instant timestamp = parseOpenMeteoTime(timeStr);
                    if (timestamp != null) {
                        aqiMap.put(timestamp, aqi != null ? aqi : 0.0);
                    }
                }

                return aqiMap;
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch hourly Air Quality map from Open-Meteo: " + e.getMessage());
        }

        return Collections.emptyMap();
    }

    private Instant parseOpenMeteoTime(String timeStr) {
        try {
            if (timeStr.endsWith("Z")) {
                return Instant.parse(timeStr);
            }
            return ZonedDateTime.parse(timeStr + ":00Z").toInstant();
        } catch (Exception e) {
            return null;
        }
    }
}