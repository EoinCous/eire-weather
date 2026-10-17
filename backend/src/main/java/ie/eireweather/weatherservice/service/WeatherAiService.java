package ie.eireweather.weatherservice.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import ie.eireweather.weatherservice.dto.HourlyForecast;
import ie.eireweather.weatherservice.dto.WeatherResponse;

@Service
public class WeatherAiService {

    @Value("${openai.api.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper;

    public WeatherAiService() {
        this.objectMapper = new ObjectMapper();
        // Register JavaTimeModule so Java 8 date/time classes serialize cleanly to strings
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Generates an AI summary for the weather data.
     * 
     * @param scope "CURRENT", "SINGLE_DAY", or "TEN_DAY"
     * @param targetDate ISO date string (e.g., "2026-10-18") required when scope is "SINGLE_DAY"
     * @param weatherResponse Cached weather data
     */
    public String generateSummary(String scope, String targetDate, WeatherResponse weatherResponse) {
        try {
            // 1. Prepare the filtered JSON payload based on scope and date
            String weatherJson = extractScopedJson(weatherResponse, scope, targetDate);

            // 2. Tailor system prompt instructions
            String systemPrompt = getSystemPromptForScope(scope, targetDate);

            // 3. Construct LLM payload
            Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", "Here is the weather data JSON:\n" + weatherJson)
                ),
                "temperature", 0.7
            );

            // 4. Call LLM API
            Map<?, ?> response = restClient.post()
                    .uri("https://api.openai.com/v1/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }

            return "Unable to generate AI summary at this moment.";

        } catch (Exception e) {
            return "Unable to generate AI summary at this moment. " + e.getMessage();
        }
    }

    private String extractScopedJson(WeatherResponse response, String scope, String targetDate) throws Exception {
        Object payloadToSerialize = switch (scope.toUpperCase()) {
            case "CURRENT" -> Map.of(
                "latitude", response.latitude(),
                "longitude", response.longitude(),
                "current", response.current()
            );

            case "SINGLE_DAY" -> {
                if (targetDate == null || targetDate.isBlank()) {
                    yield response; // Fallback to full response if date wasn't passed
                }

                LocalDate selectedDate = LocalDate.parse(targetDate);
                ZoneId irishZone = ZoneId.of("Europe/Dublin");

                // Filter hourly forecasts to match only the target date
                List<HourlyForecast> filteredHours = response.hourlyForecasts().stream()
                    .filter(hourly -> hourly.timestamp() != null && hourly.timestamp().atZone(irishZone).toLocalDate().equals(selectedDate))
                    .collect(Collectors.toList());

                yield Map.of(
                    "latitude", response.latitude(),
                    "longitude", response.longitude(),
                    "date", targetDate,
                    "hourlyForecasts", filteredHours
                );
            }

            default -> response; // TEN_DAY passes full object
        };

        return objectMapper.writeValueAsString(payloadToSerialize);
    }

    private String getSystemPromptForScope(String scope, String targetDate) {
        return switch (scope.toUpperCase()) {
            case "CURRENT" -> 
                "You are a witty, grounded local meteorologist for ÉireWeather. " +
                "Provide a punchy, 2 to 3 sentence summary of the current conditions for this specific location in Ireland. " +
                "STRICT RULES: " +
                "1) TIME-OF-DAY AWARENESS: Always tailor your summary and practical advice to the current local timestamp. " +
                "If it is nighttime or late evening, do NOT comment on sunlight or UV exposure unless noting clear starry skies or overnight cooling. " +
                "2) METEOROLOGICAL INFERENCE: Focus strictly on how it actually feels outside right now (temperature feel, wind chill, or immediate rain risk). " +
                "If the temperature is within 2°C of the dew point, warn about mist, fog, or heavy dew. Use atmospheric pressure to gauge stability (>1018 hPa settled, <1005 hPa unsettled). " +
                "3) IRISH PHRASING: Use authentic Met Éireann phrasing (e.g., 'fresh westerly breeze', 'bright spells', 'scattered showers', 'damp start'). " +
                "Give a practical tip (e.g., jackets, umbrellas, or commute warnings). Do not invent data not present in the JSON.";

            case "SINGLE_DAY" -> 
                "You are an expert meteorological assistant for ÉireWeather. " +
                "Provide a concise, practical breakdown for " + (targetDate != null ? targetDate : "this day") + " at this specific Irish location. " +
                "STRICT RULES: " +
                "1) CHRONOLOGICAL STRUCTURE: Highlight 1) Morning/commute outlook, 2) Precise timing for rain windows or heavy showers, and 3) Afternoon temperature peaks or evening settling. " +
                "2) PRACTICAL UTILITY: Note peak UV during midday hours (if applicable), wind direction shifts, and drying weather windows. " +
                "3) TONE & PHRASING: Keep it conversational, warm, under 4 sentences, and grounded entirely in the provided JSON data using natural Irish weather terms.";

            default -> 
                "You are a senior chief meteorologist for ÉireWeather. " +
                "Provide a concise, engaging 10-day outlook highlighting overall weather trends for this location in Ireland. " +
                "STRICT RULES: " +
                "1) MACRO PATTERNS: Focus on overarching synoptic trends (e.g., incoming Atlantic low-pressure fronts, settled high-pressure ridges, or blustery westerly flows). " +
                "2) WEEKEND & DRYING OUTLOOK: Highlight key transition days, notable rain bands, and drying weather windows that affect outdoor plans or farming/gardening. " +
                "3) TONE: Authoritative, clear, and engaging. Keep it to 3 to 4 sentences max without speculating beyond the forecast window.";
        };
    }
}