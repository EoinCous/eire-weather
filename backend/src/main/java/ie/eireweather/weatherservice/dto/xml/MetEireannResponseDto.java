package ie.eireweather.weatherservice.dto.xml;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

import java.util.List;

@JacksonXmlRootElement(localName = "weatherdata")
public record MetEireannResponseDto(
        @JacksonXmlProperty(localName = "product") Product product
) {
    public record Product(
            @JacksonXmlElementWrapper(useWrapping = false)
            @JacksonXmlProperty(localName = "time") List<TimeEntry> timeEntries
    ) {}

    public record TimeEntry(
            @JacksonXmlProperty(isAttribute = true) String from,
            @JacksonXmlProperty(isAttribute = true) String to,
            @JacksonXmlProperty(localName = "location") Location location
    ) {}

    public record Location(
            @JacksonXmlProperty(isAttribute = true) Double latitude,
            @JacksonXmlProperty(isAttribute = true) Double longitude,
            @JacksonXmlProperty(localName = "cloudiness") Percentage cloudiness,
            @JacksonXmlProperty(localName = "dewpointTemperature") ValueAttribute dewpointTemperature,
            @JacksonXmlProperty(localName = "temperature") ValueAttribute temperature,
            @JacksonXmlProperty(localName = "windDirection") WindDirection windDirection,
            @JacksonXmlProperty(localName = "windSpeed") WindSpeed windSpeed,
            @JacksonXmlProperty(localName = "humidity") ValueAttribute humidity,
            @JacksonXmlProperty(localName = "pressure") ValueAttribute pressure,
            @JacksonXmlProperty(localName = "precipitation") Precipitation precipitation,
            @JacksonXmlProperty(localName = "symbol") Symbol symbol
    ) {}

    public record ValueAttribute(@JacksonXmlProperty(isAttribute = true) Double value) {}
    public record Percentage(@JacksonXmlProperty(isAttribute = true) Double percent) {}
    public record WindDirection(@JacksonXmlProperty(isAttribute = true) String name) {}
    public record WindSpeed(@JacksonXmlProperty(isAttribute = true) Double mps) {}
    public record Precipitation(@JacksonXmlProperty(isAttribute = true) Double value) {}
    public record Symbol(
            @JacksonXmlProperty(isAttribute = true) String id,
            @JacksonXmlProperty(isAttribute = true) Integer number
    ) {}
}