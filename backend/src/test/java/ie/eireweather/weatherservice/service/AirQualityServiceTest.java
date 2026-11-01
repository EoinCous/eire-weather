package ie.eireweather.weatherservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AirQualityServiceTest {

    private static final String FORECAST_URL =
        "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=53.3498&longitude=-6.2603"
            + "&hourly=european_aqi,pm2_5,pm10&forecast_days=7&timezone=auto";

    @Test
    void getHourlyAqiForecastMapsZuluAndLocalTimesAndUsesZeroForNullAqi() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(FORECAST_URL))
            .andRespond(withSuccess("""
                {
                  "hourly": {
                    "time": [
                      "2026-06-01T10:00:00Z",
                      "2026-06-01T11:00",
                      "not-a-timestamp",
                      "2026-06-01T13:00"
                    ],
                    "european_aqi": [42.0, null, 60.0]
                  }
                }
                """, MediaType.APPLICATION_JSON));

        Map<Instant, Double> aqiByTime = fixture.service().getHourlyAqiForecast(53.3498, -6.2603);

        assertEquals(2, aqiByTime.size());
        assertEquals(42.0, aqiByTime.get(Instant.parse("2026-06-01T10:00:00Z")));
        assertEquals(0.0, aqiByTime.get(Instant.parse("2026-06-01T11:00:00Z")));
        fixture.server().verify();
    }

    @Test
    void getHourlyAqiForecastReturnsEmptyMapWhenResponseHasNoHourlyData() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(FORECAST_URL))
            .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        assertTrue(fixture.service().getHourlyAqiForecast(53.3498, -6.2603).isEmpty());

        fixture.server().verify();
    }

    @Test
    void getHourlyAqiForecastReturnsEmptyMapWhenRequestFails() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(FORECAST_URL))
            .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators
                .withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertTrue(fixture.service().getHourlyAqiForecast(53.3498, -6.2603).isEmpty());

        fixture.server().verify();
    }

    private Fixture fixture() {
        RestClient.Builder builder = RestClient.builder()
            .baseUrl("https://air-quality-api.open-meteo.com");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        return new Fixture(new AirQualityService(builder.build()), server);
    }

    private record Fixture(AirQualityService service, MockRestServiceServer server) {}
}
