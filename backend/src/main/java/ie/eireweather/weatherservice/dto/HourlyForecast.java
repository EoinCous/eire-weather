package ie.eireweather.weatherservice.dto;

import java.time.Instant;

public record HourlyForecast(
        Instant timestamp,
        Double temperatureC,
        Double precipitationMm,
        String weatherSymbol,
        Integer weatherSymbolNumber,
        Double windSpeedMps,
        String windDirection,
        Double humidityPercent,
        Double pressureHpa
) {}