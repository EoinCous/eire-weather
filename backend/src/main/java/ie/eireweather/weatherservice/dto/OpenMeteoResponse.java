package ie.eireweather.weatherservice.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OpenMeteoResponse(
    @JsonProperty("latitude") double latitude,
    @JsonProperty("longitude") double longitude,
    @JsonProperty("hourly") HourlyUnits hourly
) {
    public record HourlyUnits(
        @JsonProperty("time") List<String> time,
        @JsonProperty("uv_index") List<Double> uvIndex
    ) {}
}