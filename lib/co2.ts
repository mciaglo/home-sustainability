import co2Data from '@/data/cached/co2-factors.json'

const DRIVING_CO2_KG_PER_KM = 0.12 // average EU petrol car

/**
 * Returns the grid CO₂ factor (kg/kWh) for a given year,
 * interpolating from the CE Delft curve.
 */
export function getGridCo2Factor(year: number): number {
  const curve = co2Data.gridFactorCurve
  if (year <= curve[0].year) return curve[0].kgCo2PerKwh
  if (year >= curve[curve.length - 1].year) return curve[curve.length - 1].kgCo2PerKwh

  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i]
    const b = curve[i + 1]
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / (b.year - a.year)
      return a.kgCo2PerKwh + t * (b.kgCo2PerKwh - a.kgCo2PerKwh)
    }
  }
  return curve[curve.length - 1].kgCo2PerKwh
}

/** CO₂ saved per year from reduced gas consumption */
export function gasCo2SavedTonnes(m3PerYear: number): number {
  return (m3PerYear * co2Data.gasKgCo2PerM3) / 1000
}

/**
 * CO₂ saved per year from reduced electricity draw.
 * Uses current year's grid factor as a conservative estimate for annual savings.
 */
export function electricityCo2SavedTonnes(kwhPerYear: number): number {
  const currentYear = new Date().getFullYear()
  return (kwhPerYear * getGridCo2Factor(currentYear)) / 1000
}

/**
 * Lifetime CO₂ saved for an electric upgrade (e.g. heat pump, solar),
 * using the declining grid factor curve — more accurate than a flat rate.
 */
export function electricityCo2SavedTonnesLifetime(
  kwhPerYear: number,
  startYear: number,
  lifespanYears: number
): number {
  let total = 0
  for (let y = 0; y < lifespanYears; y++) {
    total += kwhPerYear * getGridCo2Factor(startYear + y)
  }
  return total / 1000
}

/** Convert tonnes CO₂/year to equivalent km of average car driving */
export function co2ToDrivingKm(tonnesPerYear: number): number {
  return Math.round((tonnesPerYear * 1000) / DRIVING_CO2_KG_PER_KM)
}
