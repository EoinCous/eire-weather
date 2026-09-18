package ie.eireweather.weatherservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import ie.eireweather.weatherservice.util.RegionCodeMapper;
import java.util.List;

public record MetEireannWarningDto(
    @JsonProperty("id") String id,
    @JsonProperty("capId") String capId,
    @JsonProperty("type") String type,     
    @JsonProperty("severity") String severity, 
    @JsonProperty("certainty") String certainty,
    @JsonProperty("level") String level, 
    @JsonProperty("issued") String issued,
    @JsonProperty("updated") String updated,
    @JsonProperty("onset") String onset,
    @JsonProperty("expiry") String expiry,
    @JsonProperty("headline") String headline,
    @JsonProperty("description") String description,
    @JsonProperty("regions") List<String> regions
) {
    // Compact constructor converts codes to place names when Jackson creates the record
    public MetEireannWarningDto {
        regions = RegionCodeMapper.toPlaceNames(regions);
    }
}