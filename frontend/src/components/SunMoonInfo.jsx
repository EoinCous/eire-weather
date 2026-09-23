import SunCalc from 'suncalc';

function getMoonPhaseName(phase) {
  if (phase === 0 || phase === 1) return 'New Moon';
  if (phase < 0.25) return 'Waxing Crescent';
  if (phase === 0.25) return 'First Quarter';
  if (phase < 0.5) return 'Waxing Gibbous';
  if (phase === 0.5) return 'Full Moon';
  if (phase < 0.75) return 'Waning Gibbous';
  if (phase === 0.75) return 'Last Quarter';
  return 'Waning Crescent';
}

export default function SunMoonInfo(lat, lon, date) {
    const sunTimes = SunCalc.getTimes(date, lat, lon);

    console.log('Sunrise:', sunTimes.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    console.log('Sunset:', sunTimes.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    console.log('Dawn (Civil Twilight):', sunTimes.dawn.toLocaleTimeString());

    const moonIllum = SunCalc.getMoonIllumination(date);

    const phaseName = getMoonPhaseName(moonIllum.phase);
    const illuminationPercent = Math.round(moonIllum.fraction * 100);

    console.log(`Moon Phase: \({phaseName} (\){illuminationPercent}% illuminated)`);

    // 3. Moonrise & Moonset
    const moonTimes = SunCalc.getMoonTimes(date, lat, lon);

    console.log('Moonrise:', moonTimes.rise ? moonTimes.rise.toLocaleTimeString() : 'No moonrise today');
    console.log('Moonset:', moonTimes.set ? moonTimes.set.toLocaleTimeString() : 'No moonset today');
    return(
        <></>
    )
}