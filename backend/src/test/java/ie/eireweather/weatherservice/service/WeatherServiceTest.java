package ie.eireweather.weatherservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import ie.eireweather.weatherservice.dto.HourlyForecast;
import ie.eireweather.weatherservice.dto.WeatherResponse;

class WeatherServiceTest {

    private static final String FORECAST_URL =
        "http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat=53.3498;long=-6.2603";

    @Test
    void getForecastMergesWeatherSourcesAndReturnsChronologicalForecasts() {
        Instant firstHour = Instant.parse("2025-01-01T10:00:00Z");
        Instant secondHour = Instant.parse("2025-01-01T11:00:00Z");
        OpenMeteoService openMeteoService = mock(OpenMeteoService.class);
        when(openMeteoService.getOpenMeteoDataAsync(53.3498, -6.2603))
            .thenReturn(CompletableFuture.completedFuture(new OpenMeteoService.OpenMeteoData(
                Map.of(firstHour, 2.5),
                Map.of(firstHour, 42.0, secondHour, 55.0)
            )));

        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
        mockServer.expect(requestTo(FORECAST_URL))
            .andRespond(withSuccess("""
                <weatherdata>
                  <product>
                    <time from="2025-01-01T11:00:00Z" to="2025-01-01T11:00:00Z">
                      <location>
                        <temperature value="8.0"/>
                        <humidity value="80.0"/>
                      </location>
                    </time>
                    <time from="2025-01-01T10:00:00Z" to="2025-01-01T11:00:00Z">
                      <location>
                        <precipitation unit="mm" value="1.2" minvalue="0.5" maxvalue="2.0" probability="44.5"/>
                        <symbol id="rain" number="5"/>
                      </location>
                    </time>
                    <time from="2025-01-01T10:00:00Z" to="2025-01-01T10:00:00Z">
                      <location>
                        <cloudiness percent="65.0"/>
                        <dewpointTemperature value="3.0"/>
                        <temperature value="7.5"/>
                        <windSpeed mps="4.0"/>
                        <windDirection name="NW"/>
                        <humidity value="75.0"/>
                        <pressure value="1012.0"/>
                      </location>
                    </time>
                    <time from="2025-01-01T09:00:00Z" to="2025-01-01T09:00:00Z"/>
                  </product>
                </weatherdata>
                """, MediaType.APPLICATION_XML));

        WeatherService weatherService = new WeatherService(openMeteoService, restClientBuilder.build());
        WeatherResponse response = weatherService.getForecast(53.3498, -6.2603);

        assertEquals(53.3498, response.latitude());
        assertEquals(-6.2603, response.longitude());
        assertEquals(2, response.hourlyForecasts().size());
        assertEquals(firstHour, response.current().timestamp());
        assertEquals(firstHour, response.hourlyForecasts().get(0).timestamp());
        assertEquals(secondHour, response.hourlyForecasts().get(1).timestamp());

        HourlyForecast first = response.current();
        assertEquals(65.0, first.cloudiness());
        assertEquals(3.0, first.dewpointTemperature());
        assertEquals(7.5, first.temperatureC());
        assertNull(first.precipitationMm());
        assertNull(first.precipitationProbability());
        assertNull(first.weatherSymbol());
        assertEquals(4.0, first.windSpeedMps());
        assertEquals("NW", first.windDirection());
        assertEquals(75.0, first.humidityPercent());
        assertEquals(1012.0, first.pressureHpa());
        assertNull(first.precipitationMinMm());
        assertNull(first.precipitationMaxMm());
        assertEquals(2.5, first.uvIndex());
        assertEquals(42.0, first.airQuality());
        assertEquals(1.2, response.hourlyForecasts().get(1).precipitationMm());
        assertEquals(0.5, response.hourlyForecasts().get(1).precipitationMinMm());
        assertEquals(2.0, response.hourlyForecasts().get(1).precipitationMaxMm());
        assertEquals(44.5, response.hourlyForecasts().get(1).precipitationProbability());
        assertEquals("rain", response.hourlyForecasts().get(1).weatherSymbol());
        assertEquals(0.0, response.hourlyForecasts().get(1).uvIndex());
        assertEquals(55.0, response.hourlyForecasts().get(1).airQuality());

        mockServer.verify();
        verify(openMeteoService).getOpenMeteoDataAsync(53.3498, -6.2603);
    }

    @Test
    void getForecastReturnsEmptyForecastWhenMetEireannResponseHasNoProduct() {
        OpenMeteoService openMeteoService = mock(OpenMeteoService.class);
        when(openMeteoService.getOpenMeteoDataAsync(53.3498, -6.2603))
            .thenReturn(CompletableFuture.completedFuture(new OpenMeteoService.OpenMeteoData(
                Map.of(), Map.of()
            )));

        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
        mockServer.expect(requestTo(FORECAST_URL))
            .andRespond(withSuccess("<weatherdata/>", MediaType.APPLICATION_XML));

        WeatherService weatherService = new WeatherService(openMeteoService, restClientBuilder.build());
        WeatherResponse response = weatherService.getForecast(53.3498, -6.2603);

        assertNull(response.current());
        assertEquals(0, response.hourlyForecasts().size());
        mockServer.verify();
    }

    @Test
    void getForecastRejectsCoordinatesOutsideValidRangesBeforeMakingRequests() {
        OpenMeteoService openMeteoService = mock(OpenMeteoService.class);
        WeatherService weatherService = new WeatherService(openMeteoService, RestClient.builder().build());

        assertThrows(IllegalArgumentException.class, () -> weatherService.getForecast(-90.01, 0.0));
        assertThrows(IllegalArgumentException.class, () -> weatherService.getForecast(90.01, 0.0));
        assertThrows(IllegalArgumentException.class, () -> weatherService.getForecast(0.0, -180.01));
        assertThrows(IllegalArgumentException.class, () -> weatherService.getForecast(0.0, 180.01));

        verifyNoInteractions(openMeteoService);
    }
}
