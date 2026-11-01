package ie.eireweather.weatherservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import ie.eireweather.weatherservice.dto.MetEireannWarningDto;

class WarningServiceTest {

    private static final String WARNINGS_URL =
        "https://www.met.ie/Open_Data/json/warning_IRELAND.json";
    private static final String WARNINGS_JSON = """
        [
          {
            "id": "warning-1",
            "severity": "Moderate",
            "headline": "Rain warning",
            "description": "Persistent rain.",
            "regions": []
          }
        ]
        """;

    @Test
    void fetchWarningsUpdatesTheActiveWarningCache() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(WARNINGS_URL))
            .andRespond(withSuccess(WARNINGS_JSON, MediaType.APPLICATION_JSON));

        assertTrue(fixture.service().getActiveWarnings().isEmpty());

        fixture.service().fetchWarnings();

        List<MetEireannWarningDto> warnings = fixture.service().getActiveWarnings();
        assertEquals(1, warnings.size());
        assertEquals("warning-1", warnings.get(0).id());
        assertEquals("Moderate", warnings.get(0).severity());
        assertEquals("Rain warning", warnings.get(0).headline());
        fixture.server().verify();
    }

    @Test
    void fetchWarningsClearsCacheWhenResponseBodyIsEmpty() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(WARNINGS_URL))
            .andRespond(withSuccess(WARNINGS_JSON, MediaType.APPLICATION_JSON));
        fixture.server().expect(requestTo(WARNINGS_URL))
            .andRespond(withSuccess("", MediaType.APPLICATION_JSON));
        fixture.service().fetchWarnings();

        fixture.service().fetchWarnings();

        assertTrue(fixture.service().getActiveWarnings().isEmpty());
        fixture.server().verify();
    }

    @Test
    void fetchWarningsClearsCacheWhenMetEireannReturnsNotFound() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(WARNINGS_URL))
            .andRespond(withSuccess(WARNINGS_JSON, MediaType.APPLICATION_JSON));
        fixture.server().expect(requestTo(WARNINGS_URL))
            .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators
                .withStatus(HttpStatus.NOT_FOUND));
        fixture.service().fetchWarnings();

        fixture.service().fetchWarnings();

        assertTrue(fixture.service().getActiveWarnings().isEmpty());
        fixture.server().verify();
    }

    @Test
    void fetchWarningsRetainsLastKnownWarningsWhenRequestFails() {
        Fixture fixture = fixture();
        fixture.server().expect(requestTo(WARNINGS_URL))
            .andRespond(withSuccess(WARNINGS_JSON, MediaType.APPLICATION_JSON));
        fixture.server().expect(requestTo(WARNINGS_URL))
            .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators
                .withServerError());
        fixture.service().fetchWarnings();
        List<MetEireannWarningDto> lastKnownWarnings = fixture.service().getActiveWarnings();

        fixture.service().fetchWarnings();

        assertEquals(lastKnownWarnings, fixture.service().getActiveWarnings());
        fixture.server().verify();
    }

    private Fixture fixture() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        return new Fixture(new WarningService(builder.build()), server);
    }

    private record Fixture(WarningService service, MockRestServiceServer server) {}
}
