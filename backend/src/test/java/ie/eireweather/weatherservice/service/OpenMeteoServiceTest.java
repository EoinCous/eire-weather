package ie.eireweather.weatherservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletionException;

import org.junit.jupiter.api.Test;

class OpenMeteoServiceTest {

    @Test
    void getOpenMeteoDataAsyncCombinesUvAndAirQualityForecasts() {
        double latitude = 53.3498;
        double longitude = -6.2603;
        Instant forecastTime = Instant.parse("2026-06-01T10:00:00Z");
        Map<Instant, Double> uvForecast = Map.of(forecastTime, 3.5);
        Map<Instant, Double> airQualityForecast = Map.of(forecastTime, 42.0);
        UvService uvService = mock(UvService.class);
        AirQualityService airQualityService = mock(AirQualityService.class);
        when(uvService.getHourlyUvForecast(latitude, longitude)).thenReturn(uvForecast);
        when(airQualityService.getHourlyAqiForecast(latitude, longitude)).thenReturn(airQualityForecast);
        OpenMeteoService openMeteoService = new OpenMeteoService(uvService, airQualityService);

        OpenMeteoService.OpenMeteoData result =
            openMeteoService.getOpenMeteoDataAsync(latitude, longitude).join();

        assertEquals(uvForecast, result.uvMap());
        assertEquals(airQualityForecast, result.airQualityMap());
        verify(uvService).getHourlyUvForecast(latitude, longitude);
        verify(airQualityService).getHourlyAqiForecast(latitude, longitude);
    }

    @Test
    void getOpenMeteoDataAsyncPropagatesFailureFromEitherForecast() {
        UvService uvService = mock(UvService.class);
        AirQualityService airQualityService = mock(AirQualityService.class);
        when(uvService.getHourlyUvForecast(53.0, -6.0))
            .thenThrow(new IllegalStateException("UV provider unavailable"));
        when(airQualityService.getHourlyAqiForecast(53.0, -6.0)).thenReturn(Map.of());
        OpenMeteoService openMeteoService = new OpenMeteoService(uvService, airQualityService);

        CompletionException exception = assertThrows(CompletionException.class,
            () -> openMeteoService.getOpenMeteoDataAsync(53.0, -6.0).join());

        assertEquals("UV provider unavailable", exception.getCause().getMessage());
        verify(uvService).getHourlyUvForecast(53.0, -6.0);
        verify(airQualityService).getHourlyAqiForecast(53.0, -6.0);
    }
}
