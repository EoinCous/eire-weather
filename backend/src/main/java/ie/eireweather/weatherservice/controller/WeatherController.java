package ie.eireweather.weatherservice.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ie.eireweather.weatherservice.dto.MetEireannWarningDto;
import ie.eireweather.weatherservice.dto.WeatherResponse;
import ie.eireweather.weatherservice.service.WarningService;
import ie.eireweather.weatherservice.service.WeatherCacheService;
import ie.eireweather.weatherservice.service.WeatherService;

@RestController
@RequestMapping("/api/v1/weather")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class WeatherController {

    private final WeatherService weatherService;
    private final WarningService warningService;
    private final WeatherCacheService weatherCacheService;

    public WeatherController(
        WeatherService weatherService, 
        WarningService warningService, 
        WeatherCacheService weatherCacheService
    ) {
        this.weatherService = weatherService;
        this.warningService = warningService;
        this.weatherCacheService = weatherCacheService;
    }
    
    @GetMapping("/forecast")
    public WeatherResponse getForecast(@RequestParam double lat, @RequestParam double lon) {
        String cacheKey = String.format("%.4f,%.4f", lat, lon);

        WeatherResponse weatherResponse = weatherService.getForecast(lat, lon);
        
        weatherCacheService.putWeatherData(cacheKey, weatherResponse);
        
        return weatherResponse;
    }

    @GetMapping("/warnings")
    public List<MetEireannWarningDto> getWarnings() {
        return warningService.getActiveWarnings();
    }
}
