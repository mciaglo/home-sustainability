import type { HomeProfile } from '@/types/home-profile'
import type { UpgradeResult, UpgradeTag, PriceScenario } from '@/types/upgrade'
import uValues from '@/data/static/nta8800-u-values.json'
import upgradeDefs from '@/data/static/upgrade-definitions.json'
import energyPrices from '@/data/cached/energy-prices.json'
import { gasCo2SavedTonnes, electricityCo2SavedTonnes, co2ToDrivingKm } from './co2'
import { getSubsidies } from './subsidies'
import { getRequiredBefore, getSynergies, isBlockedForVvE } from './combinations'

const CURRENT_YEAR = new Date().getFullYear()

type UValueEra = keyof typeof uValues.reference

function getBuildEra(yearBuilt: number): UValueEra {
  if (yearBuilt < 1945) return 'pre-1945'
  if (yearBuilt < 1975) return '1945-1974'
  if (yearBuilt < 1992) return '1975-1991'
  if (yearBuilt < 2006) return '1992-2005'
  if (yearBuilt < 2015) return '2006-2014'
  return '2015+'
}

function getPriceMultiplier(scenario: PriceScenario): number {
  switch (scenario) {
    case 'peak2022': return energyPrices.peak2022GasEuroPerM3 / energyPrices.gasEuroPerM3
    case 'conservative': return energyPrices.conservativeMultiplier
    default: return 1
  }
}

function getTag(paybackYears: number, co2Tonnes: number, annualSaving: number): UpgradeTag {
  if (paybackYears <= 2.5 && annualSaving > 100) return 'quick-win'
  if (paybackYears <= 2.5) return 'quick-win'
  if (paybackYears <= 8 && co2Tonnes > 0.5) return 'top-pick'
  if (paybackYears <= 10 && annualSaving > 300) return 'strong'
  if (paybackYears > 10 && co2Tonnes > 1) return 'high-impact'
  if (paybackYears > 10) return 'long-game'
  return 'comfort-boost'
}

/**
 * Core recommendation engine.
 * Calculates savings for all applicable upgrades and returns them ranked by annual saving.
 */
export function calculateRecommendations(
  profile: HomeProfile,
  province: string,
  municipality?: string,
  scenario: PriceScenario = 'current'
): UpgradeResult[] {
  const era = getBuildEra(profile.yearBuilt)
  const refUValues = uValues.reference[era]
  const priceMultiplier = getPriceMultiplier(scenario)
  const gasPrice = energyPrices.gasEuroPerM3 * priceMultiplier
  const electricityPrice = energyPrices.electricityEuroPerKwh * priceMultiplier

  // Estimate surface areas from floor area + building type
  const wallArea = profile.floorArea * 0.8
  const roofArea = profile.floorArea * 0.7
  const floorAreaM2 = profile.floorArea
  const windowArea = profile.floorArea * 0.15
  const heatingDegreeDays = 2750 // default; overridden by postcode lookup in full implementation

  const results: UpgradeResult[] = []

  for (const def of upgradeDefs.upgrades) {
    const upgradeId = def.id as UpgradeResult['id']

    // Skip VvE-blocked exterior upgrades
    const blockedForVvE = profile.isVvE && isBlockedForVvE(def.requiresExteriorAccess)

    // Calculate saved energy (kWh or m³/year) and annual saving
    let savedGasM3PerYear = 0
    let savedKwhPerYear = 0

    const targetUValues = uValues.targets as unknown as Record<string, Record<string, number>>

    switch (upgradeId) {
      case 'cavity-wall-insulation':
      case 'external-wall-insulation': {
        const uBefore = refUValues.wall
        const uAfter = targetUValues[upgradeId]?.wall ?? 0.35
        if (uBefore <= uAfter) break
        const heatLossReduction = (uBefore - uAfter) * wallArea // W/K
        const savedKwh = (heatLossReduction * heatingDegreeDays * 24) / 1000
        savedGasM3PerYear = savedKwh / 8.8 // kWh → m³ (NL avg calorific value)
        break
      }
      case 'roof-insulation': {
        const uBefore = refUValues.roof
        const uAfter = targetUValues['roof-insulation']?.roof ?? 0.20
        if (uBefore <= uAfter) break
        const heatLossReduction = (uBefore - uAfter) * roofArea
        const savedKwh = (heatLossReduction * heatingDegreeDays * 24) / 1000
        savedGasM3PerYear = savedKwh / 8.8
        break
      }
      case 'floor-insulation': {
        const uBefore = refUValues.floor
        const uAfter = targetUValues['floor-insulation']?.floor ?? 0.22
        if (uBefore <= uAfter) break
        const heatLossReduction = (uBefore - uAfter) * floorAreaM2
        const savedKwh = (heatLossReduction * heatingDegreeDays * 24) / 1000
        savedGasM3PerYear = savedKwh / 8.8
        break
      }
      case 'hr-plus-plus-glazing':
      case 'triple-glazing': {
        const uBefore = refUValues.glazing
        const uAfter = upgradeId === 'triple-glazing' ? 0.7 : 1.2
        if (uBefore <= uAfter) break
        const heatLossReduction = (uBefore - uAfter) * windowArea
        const savedKwh = (heatLossReduction * heatingDegreeDays * 24) / 1000
        savedGasM3PerYear = savedKwh / 8.8
        break
      }
      case 'draught-proofing': {
        // ~5–10% reduction in heat loss from air infiltration
        savedGasM3PerYear = profile.estimatedGasM3PerYear * 0.07
        break
      }
      case 'smart-thermostat': {
        // ~10–15% gas reduction from optimised scheduling
        savedGasM3PerYear = profile.estimatedGasM3PerYear * 0.12
        break
      }
      case 'solar-panels': {
        // Use PVGIS irradiance if available; else rough estimate
        const irradiance = profile.solarIrradianceKwhM2Year ?? 950
        const systemSizeKwp = Math.min(Math.floor(roofArea / 6), 10)
        savedKwhPerYear = irradiance * systemSizeKwp * 0.85 // 85% efficiency factor
        break
      }
      case 'heat-pump-air': {
        // COP ~3.0 for NL climate: replaces gas with ~3x less electricity
        const currentGasKwh = profile.estimatedGasM3PerYear * 8.8
        savedGasM3PerYear = profile.estimatedGasM3PerYear
        savedKwhPerYear = -(currentGasKwh / 3) // adds electricity consumption
        break
      }
      case 'hot-water-heat-pump': {
        // Hot water ~20% of total gas use; heat pump COP ~2.5
        const hotWaterGasM3 = profile.estimatedGasM3PerYear * 0.20
        savedGasM3PerYear = hotWaterGasM3
        savedKwhPerYear = -(hotWaterGasM3 * 8.8 / 2.5)
        break
      }
      default:
        break
    }

    const annualSaving = Math.round(
      savedGasM3PerYear * gasPrice - (savedKwhPerYear < 0 ? Math.abs(savedKwhPerYear) * electricityPrice : 0) +
      (savedKwhPerYear > 0 ? savedKwhPerYear * electricityPrice : 0)
    )

    if (annualSaving <= 0 && upgradeId !== 'solar-panels') continue

    const subsidies = getSubsidies(upgradeId, province, municipality)
    const totalSubsidy = subsidies.reduce((s, sub) => s + sub.amount, 0)
    const netCostMin = Math.max(0, def.costMinBase - totalSubsidy)
    const netCostMax = Math.max(def.costMinBase, def.costMaxBase - totalSubsidy)

    const avgNetCost = (netCostMin + netCostMax) / 2
    const paybackYears = annualSaving > 0 ? Math.round((avgNetCost / annualSaving) * 10) / 10 : 99
    const paidOffYear = CURRENT_YEAR + Math.ceil(paybackYears)
    const freeSavingsYears = Math.max(0, def.lifespanYears - Math.ceil(paybackYears))
    const totalReturn = Math.round(annualSaving * freeSavingsYears)

    const co2Tonnes = Math.round(
      (gasCo2SavedTonnes(savedGasM3PerYear) + electricityCo2SavedTonnes(Math.max(0, savedKwhPerYear))) * 10
    ) / 10

    const requiredBefore = getRequiredBefore(upgradeId).map(r => r.upgradeId)
    const synergies = getSynergies(upgradeId).map(s => ({
      upgradeId: s.upgradeId,
      saving: `${s.savingPercent}%`,
    }))

    results.push({
      id: upgradeId,
      rank: 0, // assigned after sort
      tag: getTag(paybackYears, co2Tonnes, annualSaving),
      description: def.descriptionNl,
      costMin: def.costMinBase,
      costMax: def.costMaxBase,
      subsidies,
      netCostMin,
      netCostMax,
      monthlySaving: Math.round(annualSaving / 12),
      annualSaving,
      paybackYears,
      lifespanYears: def.lifespanYears,
      paidOffYear,
      totalReturn,
      freeSavingsYears,
      co2SavedTonnesPerYear: co2Tonnes,
      co2DrivingKmEquivalent: co2ToDrivingKm(co2Tonnes),
      gasReductionPercent: profile.estimatedGasM3PerYear > 0
        ? Math.round((savedGasM3PerYear / profile.estimatedGasM3PerYear) * 100)
        : 0,
      electricitySelfProducedPercent: savedKwhPerYear > 0 && profile.estimatedElectricityKwhPerYear > 0
        ? Math.round((savedKwhPerYear / profile.estimatedElectricityKwhPerYear) * 100)
        : 0,
      requiresBefore: requiredBefore,
      benefitsFrom: synergies,
      blockedForVvE,
      dataSource: profile.dataSource,
      difficulty: def.difficulty as 'diy' | 'professional',
      installDays: def.installDays,
    })
  }

  // Sort by annual saving descending, assign ranks
  results.sort((a, b) => b.annualSaving - a.annualSaving)
  results.forEach((r, i) => { r.rank = i + 1 })

  return results
}
