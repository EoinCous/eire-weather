package ie.eireweather.weatherservice.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import ie.eireweather.weatherservice.dto.WeatherResponse;
import ie.eireweather.weatherservice.service.WeatherAiService;
import ie.eireweather.weatherservice.service.WeatherCacheService;

class AiControllerTest {

    private WeatherAiService aiService;
    private WeatherCacheService cacheService;
    private AiController controller;

    @BeforeEach
    void setUp() {
        aiService = mock(WeatherAiService.class);
        cacheService = mock(WeatherCacheService.class);
        controller = new AiController(aiService, cacheService);
    }

    @Test
    void getSummaryReturnsBadRequestWhenLocationIsNotCached() {
        when(cacheService.getWeatherData("53.3498,-6.2603")).thenReturn(null);

        ResponseEntity<Map<String, String>> response =
            controller.getSummary(53.34984, -6.26034, "CURRENT", null);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(Map.of("error", "No weather data found in cache for location."), response.getBody());
        verify(cacheService).getWeatherData("53.3498,-6.2603");
        verifyNoInteractions(aiService);
    }

    @Test
    void getSummaryUsesCachedWeatherAndReturnsGeneratedSummary() {
        WeatherResponse weather = new WeatherResponse(53.3498, -6.2603, null, List.of());
        when(cacheService.getWeatherData("53.3498,-6.2603")).thenReturn(weather);
        when(aiService.generateSummary("SINGLE_DAY", "2026-11-01", weather))
            .thenReturn("Rain is expected this afternoon.");

        ResponseEntity<Map<String, String>> response =
            controller.getSummary(53.34984, -6.26034, "SINGLE_DAY", "2026-11-01");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(Map.of("summary", "Rain is expected this afternoon."), response.getBody());
        verify(cacheService).getWeatherData("53.3498,-6.2603");
        verify(aiService).generateSummary("SINGLE_DAY", "2026-11-01", weather);
    }

    @Test
    void getSummaryPassesNullDateThroughForCurrentConditions() {
        WeatherResponse weather = new WeatherResponse(53.0, -6.0, null, List.of());
        when(cacheService.getWeatherData("53.0000,-6.0000")).thenReturn(weather);
        when(aiService.generateSummary("CURRENT", null, weather)).thenReturn("Clear and calm.");

        ResponseEntity<Map<String, String>> response =
            controller.getSummary(53.0, -6.0, "CURRENT", null);

        assertSame(HttpStatus.OK, response.getStatusCode());
        assertEquals(Map.of("summary", "Clear and calm."), response.getBody());
        verify(aiService).generateSummary("CURRENT", null, weather);
    }
}
