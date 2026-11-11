package ie.eireweather.weatherservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ResponseActions;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.RequestMatcher;
import org.springframework.web.client.RestClient;

import ie.eireweather.weatherservice.dto.HourlyForecast;
import ie.eireweather.weatherservice.dto.WeatherResponse;

class WeatherAiServiceTest {

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String API_KEY = "test-api-key";
    private static final Instant MARCH_FIRST_UTC = Instant.parse("2026-03-01T23:30:00Z");
    private static final Instant MARCH_SECOND_UTC = Instant.parse("2026-03-02T00:30:00Z");

    @Test
    void generateSummarySendsCurrentConditionsOnlyAndReturnsGeneratedSummary() {
        Fixture fixture = fixture("""
            {"choices":[{"message":{"content":"A cool, breezy start."}}]}
            """,
            header(HttpHeaders.AUTHORIZATION, "Bearer " + API_KEY),
            content().contentType(MediaType.APPLICATION_JSON),
            content().string(org.hamcrest.Matchers.containsString("temperatureC")),
            content().string(org.hamcrest.Matchers.containsString("current conditions")),
            content().string(org.hamcrest.Matchers.not(
                org.hamcrest.Matchers.containsString("hourlyForecasts"))));

        assertEquals("A cool, breezy start.", fixture.service().generateSummary("CURRENT", null, weather()));

        fixture.server().verify();
    }

    @Test
    void generateSummaryFiltersSingleDayForecastByIrishLocalDate() {
        Fixture fixture = fixture("""
            {"choices":[{"message":{"content":"Rain clears by lunchtime."}}]}
            """,
            content().string(org.hamcrest.Matchers.containsString("2026-03-02")),
            content().string(org.hamcrest.Matchers.containsString(MARCH_SECOND_UTC.toString())),
            content().string(org.hamcrest.Matchers.not(
                org.hamcrest.Matchers.containsString(MARCH_FIRST_UTC.toString()))),
            content().string(org.hamcrest.Matchers.containsString("2026-03-02 at this specific Irish location")));

        assertEquals("Rain clears by lunchtime.",
            fixture.service().generateSummary("SINGLE_DAY", "2026-03-02", weather()));

        fixture.server().verify();
    }

    @Test
    void generateSummaryUsesFullForecastForSingleDayWhenDateIsBlank() {
        Fixture fixture = fixture("""
            {"choices":[{"message":{"content":"A changeable day ahead."}}]}
            """,
            content().string(org.hamcrest.Matchers.containsString("hourlyForecasts")),
            content().string(org.hamcrest.Matchers.containsString(MARCH_FIRST_UTC.toString())),
            content().string(org.hamcrest.Matchers.containsString(MARCH_SECOND_UTC.toString())),
            content().string(org.hamcrest.Matchers.containsString("for this day at this specific Irish location")));

        assertEquals("A changeable day ahead.",
            fixture.service().generateSummary("SINGLE_DAY", " ", weather()));

        fixture.server().verify();
    }

    @Test
    void generateSummaryUsesFullForecastAndTenDayPromptForDefaultScope() {
        Fixture fixture = fixture("""
            {"choices":[{"message":{"content":"A mostly settled week."}}]}
            """,
            content().string(org.hamcrest.Matchers.containsString("hourlyForecasts")),
            content().string(org.hamcrest.Matchers.containsString("10-day outlook")));

        assertEquals("A mostly settled week.", fixture.service().generateSummary("TEN_DAY", null, weather()));

        fixture.server().verify();
    }

    @Test
    void generateSummaryReturnsFallbackWhenResponseHasNoChoices() {
        Fixture fixture = fixture("{\"error\":\"unavailable\"}");

        assertEquals("Unable to generate AI summary at this moment.",
            fixture.service().generateSummary("TEN_DAY", null, weather()));

        fixture.server().verify();
    }

    @Test
    void generateSummaryReturnsFallbackWithMessageWhenRequestFails() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(OPENAI_URL))
            .andRespond(org.springframework.test.web.client.response.MockRestResponseCreators.withServerError());

        assertEquals("Unable to generate AI summary at this moment. 500 Internal Server Error: [no body]",
            new WeatherAiService(builder.build(), API_KEY).generateSummary("CURRENT", null, weather()));

        server.verify();
    }

    private Fixture fixture(String responseBody, RequestMatcher... matchers) {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ResponseActions request = server.expect(requestTo(OPENAI_URL));
        for (RequestMatcher matcher : matchers) {
            request.andExpect(matcher);
        }
        request
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));
        return new Fixture(new WeatherAiService(builder.build(), API_KEY), server);
    }

    private WeatherResponse weather() {
        return new WeatherResponse(
            53.3498,
            -6.2603,
            forecast(MARCH_FIRST_UTC, 7.0),
            List.of(forecast(MARCH_FIRST_UTC, 7.0), forecast(MARCH_SECOND_UTC, 8.0))
        );
    }

    private HourlyForecast forecast(Instant timestamp, double temperature) {
        return new HourlyForecast(timestamp, 60.0, 4.0, temperature, null,
            0.2, null, null, null, "cloudy",
            3.0, "NW", 75.0, 1012.0, 1.0, 20.0);
    }

    private record Fixture(WeatherAiService service, MockRestServiceServer server) {}
}
