package ie.eireweather.weatherservice.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ie.eireweather.weatherservice.dto.MetEireannResponseDto;
import ie.eireweather.weatherservice.service.WeatherService;

@RestController
@RequestMapping("/api/v1/weather")
@CrossOrigin(origins = "http://localhost:5173")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }
    
    @GetMapping("/forecast")
    public MetEireannResponseDto getForecast(
        @RequestParam double lat,
        @RequestParam double lon) {
            return weatherService.getForecast(lat, lon);
        }
}
