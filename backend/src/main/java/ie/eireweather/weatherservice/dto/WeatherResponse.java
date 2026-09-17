package ie.eireweather.weatherservice.dto;

import java.util.List;

public record WeatherResponse(
        double latitude,
        double longitude,
        HourlyForecast current,
        List<HourlyForecast> hourlyForecasts
) {}