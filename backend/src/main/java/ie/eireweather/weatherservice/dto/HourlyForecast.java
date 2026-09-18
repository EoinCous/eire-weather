package ie.eireweather.weatherservice.dto;

import java.time.Instant;

public record HourlyForecast(
        Instant timestamp,
        Double cloudiness,
        Double dewpointTemperature,
        Double temperatureC,
        Double precipitationMm,
        String weatherSymbol,
        Double windSpeedMps,
        String windDirection,
        Double humidityPercent,
        Double pressureHpa
) {}