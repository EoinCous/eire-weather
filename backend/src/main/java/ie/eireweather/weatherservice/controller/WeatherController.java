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
import ie.eireweather.weatherservice.service.WeatherService;

@RestController
@RequestMapping("/api/v1/weather")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class WeatherController {

    private final WeatherService weatherService;
    private final WarningService warningService;

    public WeatherController(WeatherService weatherService, WarningService warningService) {
        this.weatherService = weatherService;
        this.warningService = warningService;
    }
    
    @GetMapping("/forecast")
    public WeatherResponse getForecast(@RequestParam double lat, @RequestParam double lon) {
        return weatherService.getForecast(lat, lon);
    }

    @GetMapping("/warnings")
    public List<MetEireannWarningDto> getWarnings() {
        return warningService.getActiveWarnings();
    }
}
