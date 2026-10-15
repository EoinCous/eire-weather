package ie.eireweather.weatherservice.dto.openmeteo;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record AirQualityResponse(
    HourlyData hourly
) {
    public record HourlyData(
        List<String> time,
        @JsonProperty("european_aqi") List<Double> europeanAqi,
        @JsonProperty("pm2_5") List<Double> pm25,
        @JsonProperty("pm10") List<Double> pm10
    ) {}
}