package ie.eireweather.weatherservice.service;

import ie.eireweather.weatherservice.dto.MetEireannWarningDto;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;

@Service
public class WarningService {

    private final RestClient restClient;
    private static final String NATIONAL_WARNINGS_URL = "https://www.met.ie/Open_Data/json/warning_IRELAND.json";

    private List<MetEireannWarningDto> cachedWarnings = Collections.emptyList();

    public WarningService() {
        this.restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT, "EireWeatherApp/1.0")
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Scheduled(fixedRate = 600000)
    public void fetchWarnings() {
        try {
            List<MetEireannWarningDto> warnings = restClient.get()
                .uri(NATIONAL_WARNINGS_URL)
                .retrieve()
                .body(new ParameterizedTypeReference<List<MetEireannWarningDto>>() {});

            this.cachedWarnings = (warnings != null) ? warnings : Collections.emptyList();
        } catch (HttpClientErrorException.NotFound e) {
            // Met Éireann returns 404 when no national warnings are active
            this.cachedWarnings = Collections.emptyList();
        } catch (Exception e) {
            // Retain last known good cache on actual network or 5xx errors
            System.err.println("Failed to update Met Éireann warnings: " + e.getMessage());
        }
    }

    public List<MetEireannWarningDto> getActiveWarnings() {
        return this.cachedWarnings;
    }
}