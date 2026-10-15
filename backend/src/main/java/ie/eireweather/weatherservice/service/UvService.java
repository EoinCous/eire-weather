package ie.eireweather.weatherservice.service;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import ie.eireweather.weatherservice.dto.openmeteo.UvResponse;

@Service
public class UvService {

    private final RestClient restClient;

    public UvService() {
        this.restClient = RestClient.create("https://api.open-meteo.com");
    }

    public Map<Instant, Double> getHourlyUvForecast(double lat, double lon) {
        try {
            UvResponse response = restClient.get()
                .uri("/v1/forecast?latitude={lat}&longitude={lon}&hourly=uv_index&forecast_days=10&timezone=auto", lat, lon)
                .retrieve()
                .body(UvResponse.class);

            if (response != null && response.hourly() != null 
                    && response.hourly().time() != null 
                    && response.hourly().uvIndex() != null) {

                List<String> times = response.hourly().time();
                List<Double> uvValues = response.hourly().uvIndex();

                Map<Instant, Double> uvMap = new HashMap<>();

                for (int i = 0; i < Math.min(times.size(), uvValues.size()); i++) {
                    String timeStr = times.get(i);
                    Double uv = uvValues.get(i);

                    Instant timestamp = parseOpenMeteoTime(timeStr);
                    if (timestamp != null) {
                        uvMap.put(timestamp, uv != null ? uv : 0.0);
                    }
                }

                return uvMap;
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch hourly UV map from Open-Meteo: " + e.getMessage());
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