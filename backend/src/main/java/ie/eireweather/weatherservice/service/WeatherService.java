package ie.eireweather.weatherservice.service;

import ie.eireweather.weatherservice.dto.MetEireannResponseDto;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.Locale;

@Service
public class WeatherService {

    private final RestClient restClient;

    private static final String MET_EIREANN_API_URL = "http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat=%.4f;long=%.4f";
    private static final String USER_AGENT_VALUE = "EireWeatherApp/1.0";

    public WeatherService() {

        this.restClient = RestClient.builder()
            .requestFactory(new HttpComponentsClientHttpRequestFactory())
            .defaultHeader(HttpHeaders.USER_AGENT, USER_AGENT_VALUE)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_XML_VALUE)
            .requestInterceptor((request, body, execution) -> {
                request.getHeaders().remove(HttpHeaders.CONTENT_LENGTH);

                return execution.execute(request, body);
            })
            .build();
    }

    @Cacheable(value = "forecasts", key = "#lat + '-' + #lon")
    public MetEireannResponseDto getForecast(double lat, double lon) {
        String rawUrl = String.format(Locale.US, MET_EIREANN_API_URL, lat, lon);

        return restClient.get()
            .uri(URI.create(rawUrl))
            .retrieve()
            .body(MetEireannResponseDto.class);
    }
}