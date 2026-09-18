package ie.eireweather.weatherservice.util;

import java.util.List;
import java.util.Map;

public class RegionCodeMapper {

    private static final Map<String, String> REGION_MAP = Map.ofEntries(
        // Counties
        Map.entry("EI01", "Carlow"),
        Map.entry("EI02", "Cavan"),
        Map.entry("EI03", "Clare"),
        Map.entry("EI04", "Cork"),
        Map.entry("EI06", "Donegal"),
        Map.entry("EI07", "Dublin"),
        Map.entry("EI10", "Galway"),
        Map.entry("EI11", "Kerry"),
        Map.entry("EI12", "Kildare"),
        Map.entry("EI13", "Kilkenny"),
        Map.entry("EI14", "Leitrim"),
        Map.entry("EI15", "Laois"),
        Map.entry("EI16", "Limerick"),
        Map.entry("EI18", "Longford"),
        Map.entry("EI19", "Louth"),
        Map.entry("EI20", "Mayo"),
        Map.entry("EI21", "Meath"),
        Map.entry("EI22", "Monaghan"),
        Map.entry("EI23", "Offaly"),
        Map.entry("EI24", "Roscommon"),
        Map.entry("EI25", "Sligo"),
        Map.entry("EI26", "Tipperary"),
        Map.entry("EI27", "Waterford"),
        Map.entry("EI29", "Westmeath"),
        Map.entry("EI30", "Wexford"),
        Map.entry("EI31", "Wicklow"),

        // Sea Areas
        Map.entry("EI805", "Malin-Fair"),
        Map.entry("EI806", "Fair-Belfast"),
        Map.entry("EI807", "Belfast-Strang"),
        Map.entry("EI808", "Strang-Carl"),
        Map.entry("EI809", "Carling-Howth"),
        Map.entry("EI810", "Howth-Wicklow"),
        Map.entry("EI811", "Wicklow-Carns"),
        Map.entry("EI812", "Carns-Hook"),
        Map.entry("EI813", "Hook-Dungarvan"),
        Map.entry("EI814", "Dungarvan-Roches"),
        Map.entry("EI815", "Roches-Mizen"),
        Map.entry("EI816", "Mizen-Valentia"),
        Map.entry("EI817", "Valentia-Loop"),
        Map.entry("EI818", "Loop-Slyne"),
        Map.entry("EI819", "Slyne-Erris"),
        Map.entry("EI820", "Erris-Rossan"),
        Map.entry("EI821", "Rossan-BloodyF"),
        Map.entry("EI822", "BloodF-Malin"),
        Map.entry("EI823", "IrishSea-South"),
        Map.entry("EI824", "IrishSea-IOM-S"),
        Map.entry("EI825", "IrishSea-IOM-N")
    );

    public static String toPlaceName(String code) {
        return REGION_MAP.getOrDefault(code, code);
    }

    public static List<String> toPlaceNames(List<String> codes) {
        if (codes == null) return List.of();
        return codes.stream()
                .map(RegionCodeMapper::toPlaceName)
                .toList();
    }
}