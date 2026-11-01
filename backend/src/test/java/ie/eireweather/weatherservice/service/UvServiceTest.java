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

class UvServiceTest {

    private static final String FORECAST_URL =
        "https://api.open-meteo.com/v1/forecast?latitude=53.3498&longitude=-6.2603"
            + "&hourly=uv_index&forecast_days=10&timezone=auto";

    @Test
    void getHourlyUvForecastMapsZuluAndLocalTimesAndUsesZeroForNullUv() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(FORECAST_URL))
            .andRespond(withSuccess("""
                {
                  "latitude": 53.3498,
                  "longitude": -6.2603,
                  "hourly": {
                    "time": [
                      "2026-06-01T10:00:00Z",
                      "2026-06-01T11:00",
                      "not-a-timestamp",
                      "2026-06-01T13:00"
                    ],
                    "uv_index": [2.5, null, 4.0]
                  }
                }
                """, MediaType.APPLICATION_JSON));

        Map<Instant, Double> uvByTime = fixture.service().getHourlyUvForecast(53.3498, -6.2603);

        assertEquals(2, uvByTime.size());
        assertEquals(2.5, uvByTime.get(Instant.parse("2026-06-01T10:00:00Z")));
        assertEquals(0.0, uvByTime.get(Instant.parse("2026-06-01T11:00:00Z")));
        fixture.server().verify();
    }

    @Test
    void getHourlyUvForecastReturnsEmptyMapWhenResponseHasNoHourlyData() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(FORECAST_URL))
            .andRespond(withSuccess("""
                {"latitude":53.3498,"longitude":-6.2603}
                """, MediaType.APPLICATION_JSON));

        assertTrue(fixture.service().getHourlyUvForecast(53.3498, -6.2603).isEmpty());

        fixture.server().verify();
    }

    @Test
    void getHourlyUvForecastReturnsEmptyMapWhenRequestFails() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(FORECAST_URL))
            .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators
                .withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertTrue(fixture.service().getHourlyUvForecast(53.3498, -6.2603).isEmpty());

        fixture.server().verify();
    }

    private Fixture fixture() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.open-meteo.com");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        return new Fixture(new UvService(builder.build()), server);
    }

    private record Fixture(UvService service, MockRestServiceServer server) {}
}
