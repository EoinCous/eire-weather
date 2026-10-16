package ie.eireweather.weatherservice.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ie.eireweather.weatherservice.dto.WeatherResponse;
import ie.eireweather.weatherservice.service.WeatherAiService;
import ie.eireweather.weatherservice.service.WeatherCacheService;

@RestController 
@RequestMapping("/api/ai")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class AiController {

    private final WeatherAiService aiService;
    private final WeatherCacheService cacheService;

    public AiController(WeatherAiService aiService, WeatherCacheService cacheService) {
        this.aiService = aiService;
        this.cacheService = cacheService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, String>> getSummary(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam String scope,
            @RequestParam(required = false) String date) {

        String cacheKey = String.format("%.4f,%.4f", lat, lon);
        WeatherResponse weatherData = cacheService.getWeatherData(cacheKey);

        if (weatherData == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No weather data found in cache for location."));
        }

        String summary = aiService.generateSummary(scope, date, weatherData);

        return ResponseEntity.ok(Map.of("summary", summary));
    }
}