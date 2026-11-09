package ie.eireweather.weatherservice.controller;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import ie.eireweather.weatherservice.dto.MetEireannWarningDto;
import ie.eireweather.weatherservice.dto.WeatherResponse;
import ie.eireweather.weatherservice.service.WarningService;
import ie.eireweather.weatherservice.service.WeatherCacheService;
import ie.eireweather.weatherservice.service.WeatherService;

class WeatherControllerTest {

    private WeatherService weatherService;
    private WarningService warningService;
    private WeatherCacheService weatherCacheService;
    private WeatherController controller;

    @BeforeEach
    void setUp() {
        weatherService = mock(WeatherService.class);
        warningService = mock(WarningService.class);
        weatherCacheService = mock(WeatherCacheService.class);
        controller = new WeatherController(weatherService, warningService, weatherCacheService);
    }

    @Test
    void getForecastReturnsWeatherAndCachesItUsingRoundedCoordinates() {
        double latitude = 53.34984;
        double longitude = -6.26034;
        WeatherResponse response = new WeatherResponse(latitude, longitude, null, List.of());
        when(weatherService.getForecast(latitude, longitude)).thenReturn(response);

        WeatherResponse result = controller.getForecast(latitude, longitude, false);

        assertSame(response, result);
        verify(weatherService).getForecast(latitude, longitude);
        verify(weatherCacheService).putWeatherData("53.3498,-6.2603", response);
    }

    @Test
    void getForecastRefreshesAndCachesWeatherWhenRequested() {
        double latitude = 53.3498;
        double longitude = -6.2603;
        WeatherResponse response = new WeatherResponse(latitude, longitude, null, List.of());
        when(weatherService.refreshForecast(latitude, longitude)).thenReturn(response);

        WeatherResponse result = controller.getForecast(latitude, longitude, true);

        assertSame(response, result);
        verify(weatherService).refreshForecast(latitude, longitude);
        verify(weatherService, never()).getForecast(latitude, longitude);
        verify(weatherCacheService).putWeatherData("53.3498,-6.2603", response);
    }

    @Test
    void getWarningsReturnsActiveWarnings() {
        List<MetEireannWarningDto> warnings = List.of(new MetEireannWarningDto(
            "warning-1",
            "cap-1",
            "Rain",
            "Moderate",
            "Likely",
            "Yellow",
            "2026-11-01T10:00:00Z",
            "2026-11-01T10:00:00Z",
            "2026-11-01T12:00:00Z",
            "2026-11-01T18:00:00Z",
            "Rain warning",
            "Persistent rain expected.",
            List.of("Dublin")
        ));
        when(warningService.getActiveWarnings()).thenReturn(warnings);

        List<MetEireannWarningDto> result = controller.getWarnings();

        assertSame(warnings, result);
        verify(warningService).getActiveWarnings();
    }
}
