package ie.eireweather.weatherservice.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import java.util.List;

@JacksonXmlRootElement(localName = "weatherdata")
public class MetEireannResponseDto {

    @JacksonXmlProperty(localName = "product")
    private Product product;

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public static class Product {
        @JacksonXmlElementWrapper(useWrapping = false)
        @JacksonXmlProperty(localName = "time")
        private List timeSteps;

        public List getTimeSteps() { return timeSteps; }
        public void setTimeSteps(List timeSteps) { this.timeSteps = timeSteps; }
    }

    public static class TimeStep {
        @JacksonXmlProperty(isAttribute = true)
        private String from;

        @JacksonXmlProperty(isAttribute = true)
        private String to;

        @JacksonXmlProperty(localName = "location")
        private LocationData location;

        public String getFrom() { return from; }
        public String getTo() { return to; }
        public LocationData getLocation() { return location; }
    }

    public static class LocationData {
        @JacksonXmlProperty(localName = "temperature")
        private ValueElement temperature;

        @JacksonXmlProperty(localName = "windDirection")
        private WindDirection windDirection;

        @JacksonXmlProperty(localName = "windSpeed")
        private ValueElement windSpeed;

        @JacksonXmlProperty(localName = "globalCompositeSymbol")
        private SymbolElement symbol;

        public ValueElement getTemperature() { return temperature; }
        public WindDirection getWindDirection() { return windDirection; }
        public ValueElement getWindSpeed() { return windSpeed; }
        public SymbolElement getSymbol() { return symbol; }
    }

    public static class ValueElement {
        @JacksonXmlProperty(isAttribute = true)
        private String value;
        public String getValue() { return value; }
    }

    public static class WindDirection {
        @JacksonXmlProperty(isAttribute = true, localName = "name")
        private String name;
        public String getName() { return name; }
    }

    public static class SymbolElement {
        @JacksonXmlProperty(isAttribute = true, localName = "number")
        private String number;
        public String getNumber() { return number; }
    }
}