import type { HomeProfile, InsulationProfile, EnergyLabel } from '@/types/home-profile'
import type { UpgradeResult, UpgradeTag, PriceScenario, TierResult, Subsidy } from '@/types/upgrade'
import uValues from '@/data/static/nta8800-u-values.json'
import upgradeDefs from '@/data/static/upgrade-definitions.json'
import energyPrices from '@/data/cached/energy-prices.json'
import hddData from '@/data/static/heating-degree-days.json'
import { getGridCo2Factor, co2ToTrees } from './co2'
import { getSubsidies } from './subsidies'
import { getRequiredBefore, getSynergies, isBlockedForVvE } from './combinations'
import { EPC_DELTA as SHARED_EPC_DELTA, LABEL_ORDER } from './constants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear()
const BOILER_EFFICIENCY = 0.92
const REFERENCE_FLOOR_AREA = 100
const HOT_WATER_FRACTION = 0.20
const BASE_SELF_CONSUMPTION = 0.35
const COP_HOT_WATER = 2.5
const CEILING_HEIGHT = 2.6
const AIR_HEAT_FACTOR = 0.335 // ρ_air × c_p = 1.2 × 0.279 Wh/(kg·K)
const BATTERY_CYCLES_PER_YEAR = 250
const HYBRID_HP_FRACTION = 0.60 // fraction of heating met by heat pump in hybrid

const SMART_THERMO_FACTOR: Record<string, number> = {
  'gas-boiler': 0.90,
  'heat-pump': 0.85,
  'hybrid': 0.87,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HomeEnergyModel {
  losses: {
    walls: number
    roof: number
    floor: number
    glazing: number
    ventilation: number
  }
  totalHeatingDemandKwh: number
  hotWaterDemandKwh: number

  heating: {
    source: 'gas-boiler' | 'heat-pump' | 'hybrid'
    gasM3: number
    electricityKwh: number
    cop?: number
  }
  hotWater: {
    source: 'gas-boiler' | 'heat-pump-boiler'
    gasM3: number
    electricityKwh: number
  }

  applianceKwh: number
  solarProductionKwh: number
  selfConsumedKwh: number
  exportedKwh: number

  totalGasM3: number
  totalElectricityFromGridKwh: number
  totalCostEuro: number
  totalCo2Tonnes: number

  normalizationFactor: number
}

export interface AppliedUpgrade {
  id: string
  tierId?: string
  params?: Record<string, number>
}

interface ModelDiff {
  gasSavedM3: number
  electricitySavedFromGridKwh: number
  annualSavingEuro: number
  co2SavedTonnes: number
  gasReductionPercent: number
  electricitySelfProducedPercent: number
}

export interface Restriction {
  type: 'blocked' | 'warning'
  reasonNl: string
  reasonEn: string
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type UValueEra = keyof typeof uValues.reference

function getBuildEra(yearBuilt: number): UValueEra {
  if (yearBuilt < 1945) return 'pre-1945'
  if (yearBuilt < 1975) return '1945-1974'
  if (yearBuilt < 1992) return '1975-1991'
  if (yearBuilt < 2006) return '1992-2005'
  if (yearBuilt < 2015) return '2006-2014'
  return '2015+'
}

function getEffectiveUValues(
  eraUValues: { wall: number; roof: number; floor: number; glazing: number },
  insulation: InsulationProfile,
): { wall: number; roof: number; floor: number; glazing: number } {
  const overrides = uValues.insulationLevelOverrides as Record<string, Record<string, number>>
  const surfaces = ['wall', 'roof', 'floor', 'glazing'] as const
  const result = { ...eraUValues }
  for (const s of surfaces) {
    const level = insulation[s]
    if (level !== 'unknown' && overrides[s]?.[level] !== undefined) {
      result[s] = overrides[s][level]
    }
  }
  return result
}

function inferStories(buildingType: string, floorArea: number): number {
  if (buildingType === 'apartment') return 1
  if (buildingType === 'terraced' || buildingType === 'corner') return floorArea < 90 ? 1 : 2
  if (buildingType === 'semi-detached') return floorArea < 100 ? 1 : 2
  if (buildingType === 'detached') return floorArea < 120 ? 1 : (floorArea > 250 ? 3 : 2)
  return 2
}

function scaleUpgradeCost(
  upgradeId: string, baseCostMin: number, baseCostMax: number, relevantArea: number,
): { costMin: number; costMax: number } {
  const areaScaled = new Set([
    'cavity-wall-insulation', 'external-wall-insulation',
    'roof-insulation', 'floor-insulation', 'glazing',
  ])
  if (!areaScaled.has(upgradeId)) return { costMin: baseCostMin, costMax: baseCostMax }
  const factor = Math.max(0.5, Math.min(3.0, relevantArea / REFERENCE_FLOOR_AREA))
  return { costMin: Math.round(baseCostMin * factor), costMax: Math.round(baseCostMax * factor) }
}

export function getScenarioPrices(scenario: PriceScenario, profile?: { contractGasEuroPerM3?: number; contractElectricityEuroPerKwh?: number }): { gas: number; electricity: number } {
  switch (scenario) {
    case 'peak2022':
      return { gas: energyPrices.peak2022GasEuroPerM3, electricity: energyPrices.electricityEuroPerKwh * (energyPrices.peak2022GasEuroPerM3 / energyPrices.gasEuroPerM3) }
    case 'conservative':
      return { gas: energyPrices.gasEuroPerM3 * energyPrices.conservativeMultiplier, electricity: energyPrices.electricityEuroPerKwh * energyPrices.conservativeMultiplier }
    case 'contract':
      return {
        gas: profile?.contractGasEuroPerM3 ?? energyPrices.gasEuroPerM3,
        electricity: profile?.contractElectricityEuroPerKwh ?? energyPrices.electricityEuroPerKwh,
      }
    default:
      return { gas: energyPrices.gasEuroPerM3, electricity: energyPrices.electricityEuroPerKwh }
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

const EPC_DELTA: Record<string, number> = {
  ...SHARED_EPC_DELTA,
  'hr-plus-plus-glazing': 1,
  'triple-glazing': 1,
  'heat-pump-air': 2,
  'heat-pump-ground': 2,
}

function getFeedInRate(): number {
  return (energyPrices as unknown as Record<string, number>).feedInRateEuroPerKwh ?? 0.11
}

// ---------------------------------------------------------------------------
// Housing restrictions
// ---------------------------------------------------------------------------

export function getRestrictions(upgradeId: string, profile: HomeProfile): Restriction[] {
  const r: Restriction[] = []
  const bt = profile.buildingType

  switch (upgradeId) {
    case 'cavity-wall-insulation':
      if (profile.yearBuilt < 1920) {
        r.push({ type: 'blocked', reasonNl: 'Woningen van voor 1920 hebben meestal massieve muren zonder spouw.', reasonEn: 'Pre-1920 homes usually have solid walls without a cavity.' })
      }
      break
    case 'external-wall-insulation':
      if (bt === 'terraced') {
        r.push({ type: 'warning', reasonNl: 'Alleen voor- en achtergevel mogelijk (gedeelde zijmuren).', reasonEn: 'Only front and rear walls possible (shared side walls).' })
      }
      if (profile.isMonument) {
        r.push({ type: 'blocked', reasonNl: 'Niet toegestaan bij monumenten zonder speciale vergunning.', reasonEn: 'Not permitted on listed buildings without special permission.' })
      }
      break
    case 'floor-insulation':
      if (bt === 'apartment') {
        r.push({ type: 'warning', reasonNl: 'Appartementen hebben meestal geen kruipruimte.', reasonEn: 'Apartments usually have no crawl space.' })
      }
      break
    case 'heat-pump':
      if (bt === 'apartment') {
        r.push({ type: 'warning', reasonNl: 'Buitenunit vereist VvE-goedkeuring en geschikte plaatsing.', reasonEn: 'Outdoor unit requires VvE approval and suitable placement.' })
      }
      if (bt === 'terraced') {
        r.push({ type: 'warning', reasonNl: 'Geluidsnorm: max 40 dB op de erfgrens. Buitenunit heeft 4-5 m afstand nodig.', reasonEn: 'Noise limit: max 40 dB at property boundary. Outdoor unit needs 4-5 m distance.' })
      }
      break
    case 'solar-panels':
      if (bt === 'apartment') {
        r.push({ type: 'warning', reasonNl: 'VvE-goedkeuring nodig voor gebruik van het gemeenschappelijke dak.', reasonEn: 'VvE approval needed for use of the shared roof.' })
      }
      if (profile.isMonument) {
        r.push({ type: 'warning', reasonNl: 'Vergunning vereist, kan worden geweigerd bij monumenten.', reasonEn: 'Permit required, may be refused for listed buildings.' })
      }
      break
    case 'mechanical-ventilation':
      if (profile.yearBuilt < 1975) {
        r.push({ type: 'warning', reasonNl: 'Lastig te installeren in oudere woningen (kanaalwerk nodig).', reasonEn: 'Difficult to install in older homes (ductwork needed).' })
      }
      break
  }

  // Ground-source tier restriction
  if (upgradeId === 'heat-pump') {
    if (bt === 'apartment') {
      r.push({ type: 'blocked', reasonNl: 'Bodem-warmtepomp niet mogelijk zonder tuin.', reasonEn: 'Ground-source heat pump not possible without a garden.' })
    }
    if (bt === 'terraced') {
      r.push({ type: 'warning', reasonNl: 'Bodem-warmtepomp vereist voldoende tuinoppervlak voor boorgaten.', reasonEn: 'Ground-source heat pump requires sufficient garden space for boreholes.' })
    }
  }

  return r
}

// ---------------------------------------------------------------------------
// Whole-house energy model
// ---------------------------------------------------------------------------

export function buildEnergyModel(
  profile: HomeProfile,
  province: string,
  appliedUpgrades: AppliedUpgrade[],
  prices: { gas: number; electricity: number },
): HomeEnergyModel {
  const era = getBuildEra(profile.yearBuilt)
  const rawUValues = uValues.reference[era]
  const baseUValues = getEffectiveUValues(rawUValues, profile.insulation)
  const achTable = uValues.airChangesPerHour as Record<string, number>

  // Areas
  const areaRatios: Record<string, { wall: number; roof: number; window: number }> = {
    detached:       { wall: 1.0,  roof: 0.8,  window: 0.18 },
    'semi-detached': { wall: 0.85, roof: 0.75, window: 0.16 },
    corner:         { wall: 0.85, roof: 0.7,  window: 0.16 },
    terraced:       { wall: 0.6,  roof: 0.7,  window: 0.15 },
    apartment:      { wall: 0.4,  roof: 0.3,  window: 0.12 },
  }
  const ratios = areaRatios[profile.buildingType] ?? areaRatios.terraced
  const stories = inferStories(profile.buildingType, profile.floorArea)
  const groundFloorArea = profile.floorArea / stories
  const wallArea = profile.floorArea * ratios.wall
  const roofArea = groundFloorArea * ratios.roof
  const floorArea = groundFloorArea
  const windowArea = profile.floorArea * ratios.window
  const volume = profile.floorArea * CEILING_HEIGHT

  const hdd = (hddData.regions as Record<string, number>)[province] ?? hddData.national_average
  const targetUValues = uValues.targets as unknown as Record<string, Record<string, number>>
  const copTable = uValues.heatPumpCopByLabel as Record<string, Record<string, number>>
  const feedInRate = getFeedInRate()

  // --- Step 1: Apply upgrades to building parameters ---

  const u = { ...baseUValues }
  let ach = achTable[era] ?? 0.8
  let hasSmartThermostat = false
  let hasMVHR = false
  let heatingSource: 'gas-boiler' | 'heat-pump' | 'hybrid' =
    profile.heatingType === 'hybrid-heat-pump' ? 'hybrid'
    : profile.heatingType?.startsWith('heat-pump') ? 'heat-pump'
    : 'gas-boiler'
  let hwSource: 'gas-boiler' | 'heat-pump-boiler' = 'gas-boiler'
  let hpCop = 3.0
  let hybridFraction = HYBRID_HP_FRACTION
  let solarKwp = 0
  let batteryKwh = 0
  let insulationEpcDelta = 0

  // Account for existing upgrades
  if (profile.existingUpgrades?.solarPanels?.has) {
    const maxKwp = Math.min(Math.floor(roofArea / 6), 20)
    solarKwp = Math.min(profile.existingUpgrades.solarPanels.count ?? 10, maxKwp * 2) * 0.45
  }
  if (profile.existingUpgrades?.homeBattery?.has) {
    batteryKwh = 10
  }
  if (heatingSource === 'heat-pump') {
    const srcType = profile.heatingType === 'heat-pump-ground' ? 'ground-source' : 'air-source'
    hpCop = copTable[srcType]?.[profile.energyLabel] ?? 3.0
  } else if (heatingSource === 'hybrid') {
    hpCop = copTable['hybrid']?.[profile.energyLabel] ?? 3.0
  }

  for (const upg of appliedUpgrades) {
    switch (upg.id) {
      case 'cavity-wall-insulation':
        u.wall = Math.min(u.wall, targetUValues['cavity-wall-insulation']?.wall ?? 0.35)
        insulationEpcDelta += EPC_DELTA['cavity-wall-insulation'] ?? 0
        break
      case 'external-wall-insulation':
        u.wall = Math.min(u.wall, targetUValues['external-wall-insulation']?.wall ?? 0.22)
        insulationEpcDelta += EPC_DELTA['external-wall-insulation'] ?? 0
        break
      case 'roof-insulation':
        u.roof = Math.min(u.roof, upg.params?.uValue ?? targetUValues['roof-insulation']?.roof ?? 0.20)
        insulationEpcDelta += EPC_DELTA['roof-insulation'] ?? 0
        break
      case 'floor-insulation':
        u.floor = Math.min(u.floor, upg.params?.uValue ?? targetUValues['floor-insulation']?.floor ?? 0.22)
        insulationEpcDelta += EPC_DELTA['floor-insulation'] ?? 0
        break
      case 'glazing':
        u.glazing = Math.min(u.glazing, upg.params?.uValue ?? 1.2)
        insulationEpcDelta += EPC_DELTA[upg.tierId ?? 'glazing'] ?? 0
        break
      case 'draught-proofing':
        ach = Math.max(0.2, ach - 0.25)
        break
      case 'mechanical-ventilation':
        hasMVHR = true
        break
      case 'smart-thermostat':
        hasSmartThermostat = true
        break
      case 'heat-pump': {
        const isHybrid = upg.params?.hybrid === 1 || upg.tierId === 'hybrid'
        heatingSource = isHybrid ? 'hybrid' : 'heat-pump'
        if (isHybrid) {
          hybridFraction = upg.params?.hpFraction ?? HYBRID_HP_FRACTION
        } else {
          hwSource = 'heat-pump-boiler'
        }
        const srcType = upg.tierId === 'air-to-air' ? 'air-to-air'
          : upg.tierId === 'hybrid' ? 'hybrid'
          : (upg.params?.cop ?? 3.0) >= 3.5 ? 'ground-source' : 'air-source'
        const currentLabelIdx = LABEL_ORDER.indexOf(profile.energyLabel as EnergyLabel)
        const effectiveLabelIdx = Math.min(
          (currentLabelIdx >= 0 ? currentLabelIdx : 4) + insulationEpcDelta,
          LABEL_ORDER.length - 1
        )
        const effectiveLabel = LABEL_ORDER[effectiveLabelIdx]
        hpCop = copTable[srcType]?.[effectiveLabel] ?? copTable['air-source']?.[effectiveLabel] ?? upg.params?.cop ?? 3.0
        break
      }
      case 'hot-water-heat-pump':
        hwSource = 'heat-pump-boiler'
        break
      case 'solar-panels': {
        const maxKwp = Math.min(Math.floor(roofArea / 6), 20)
        const coveragePct = upg.params?.coveragePct ?? 1.0
        solarKwp = Math.max(1, Math.round(maxKwp * coveragePct)) * 0.45
        break
      }
      case 'home-battery':
        batteryKwh = upg.params?.capacityKwh ?? 10
        break
    }
  }

  // --- Step 2: Calculate heat losses ---

  const wallLoss = u.wall * wallArea * hdd * 24 / 1000
  const roofLoss = u.roof * roofArea * hdd * 24 / 1000
  const floorLoss = u.floor * floorArea * hdd * 24 / 1000
  const glazingLoss = u.glazing * windowArea * hdd * 24 / 1000
  let ventLoss = AIR_HEAT_FACTOR * ach * volume * hdd * 24 / 1000
  if (hasMVHR) ventLoss *= 0.20

  const rawHeatingDemand = wallLoss + roofLoss + floorLoss + glazingLoss + ventLoss

  // --- Step 3: Normalize to actual consumption (additive correction) ---

  const spaceHeatingGasM3 = profile.estimatedGasM3PerYear * (1 - HOT_WATER_FRACTION)
  const hotWaterGasM3 = profile.estimatedGasM3PerYear * HOT_WATER_FRACTION
  const hotWaterDemandKwh = hotWaterGasM3 * 8.8 * BOILER_EFFICIENCY

  // Baseline theoretical demand (no upgrades)
  const rawWallLoss = baseUValues.wall * wallArea * hdd * 24 / 1000
  const rawRoofLoss = baseUValues.roof * roofArea * hdd * 24 / 1000
  const rawFloorLoss = baseUValues.floor * floorArea * hdd * 24 / 1000
  const rawGlazingLoss = baseUValues.glazing * windowArea * hdd * 24 / 1000
  const baseAch = achTable[era] ?? 0.8
  const rawVentLoss = AIR_HEAT_FACTOR * baseAch * volume * hdd * 24 / 1000
  const rawTotalDemand = rawWallLoss + rawRoofLoss + rawFloorLoss + rawGlazingLoss + rawVentLoss
  const actualHeatingKwh = spaceHeatingGasM3 * 8.8 * BOILER_EFFICIENCY

  // "Free heat" = difference between theoretical demand and actual consumption
  // (solar gains, internal heat, occupant behaviour)
  const freeHeatKwh = Math.max(0, rawTotalDemand - actualHeatingKwh)

  // Subtract the same absolute free heat from upgraded demand
  const adjustedHeatingDemand = Math.max(0, rawHeatingDemand - freeHeatKwh)

  const normFactor = rawTotalDemand > 0 ? actualHeatingKwh / rawTotalDemand : 1

  const losses = {
    walls: wallLoss * normFactor,
    roof: roofLoss * normFactor,
    floor: floorLoss * normFactor,
    glazing: glazingLoss * normFactor,
    ventilation: ventLoss * normFactor,
  }

  // --- Step 4: Apply thermostat reduction ---

  let finalHeatingDemand = adjustedHeatingDemand
  if (hasSmartThermostat) {
    const factor = SMART_THERMO_FACTOR[heatingSource] ?? 0.90
    finalHeatingDemand *= factor
  }

  // --- Step 5: How demand is met ---

  const heating = { source: heatingSource, gasM3: 0, electricityKwh: 0, cop: undefined as number | undefined }
  if (heatingSource === 'heat-pump') {
    heating.electricityKwh = finalHeatingDemand / hpCop
    heating.cop = hpCop
  } else if (heatingSource === 'hybrid') {
    heating.electricityKwh = (finalHeatingDemand * hybridFraction) / hpCop
    heating.gasM3 = (finalHeatingDemand * (1 - hybridFraction)) / (8.8 * BOILER_EFFICIENCY)
    heating.cop = hpCop
  } else {
    heating.gasM3 = finalHeatingDemand / (8.8 * BOILER_EFFICIENCY)
  }

  const hotWater = { source: hwSource, gasM3: 0, electricityKwh: 0 }
  if (hwSource === 'heat-pump-boiler') {
    hotWater.electricityKwh = hotWaterDemandKwh / COP_HOT_WATER
  } else {
    hotWater.gasM3 = hotWaterGasM3
  }

  // --- Step 6: Electricity balance ---

  const applianceKwh = profile.estimatedElectricityKwhPerYear
  const totalElecDemand = applianceKwh + heating.electricityKwh + hotWater.electricityKwh

  const solarProductionKwh = solarKwp > 0
    ? (profile.solarIrradianceKwhM2Year ?? 950) * solarKwp * 0.85
    : 0

  let selfConsumedKwh = 0
  let exportedKwh = 0
  if (solarProductionKwh > 0) {
    let selfConsumptionRatio = BASE_SELF_CONSUMPTION
    if (batteryKwh > 0) {
      const batteryShift = batteryKwh * BATTERY_CYCLES_PER_YEAR * 0.85
      const baseExport = solarProductionKwh * (1 - BASE_SELF_CONSUMPTION)
      const extraSelfConsumed = Math.min(batteryShift, baseExport)
      selfConsumptionRatio = Math.min(0.85, (solarProductionKwh * BASE_SELF_CONSUMPTION + extraSelfConsumed) / solarProductionKwh)
    }
    selfConsumedKwh = Math.min(solarProductionKwh * selfConsumptionRatio, totalElecDemand)
    exportedKwh = solarProductionKwh - selfConsumedKwh
  }

  const gridElectricity = Math.max(0, totalElecDemand - selfConsumedKwh)

  // --- Step 7: Totals ---

  const totalGasM3 = heating.gasM3 + hotWater.gasM3
  const gridCo2Factor = getGridCo2Factor(CURRENT_YEAR)
  const totalCostEuro = Math.round(
    totalGasM3 * prices.gas +
    gridElectricity * prices.electricity -
    exportedKwh * feedInRate
  )
  const totalCo2Tonnes = Math.round(
    (totalGasM3 * 1.884 / 1000 + gridElectricity * gridCo2Factor / 1000) * 10
  ) / 10

  return {
    losses,
    totalHeatingDemandKwh: finalHeatingDemand,
    hotWaterDemandKwh,
    heating,
    hotWater,
    applianceKwh,
    solarProductionKwh,
    selfConsumedKwh,
    exportedKwh,
    totalGasM3,
    totalElectricityFromGridKwh: gridElectricity,
    totalCostEuro,
    totalCo2Tonnes,
    normalizationFactor: normFactor,
  }
}

export function diffModels(before: HomeEnergyModel, after: HomeEnergyModel): ModelDiff {
  const gasSaved = before.totalGasM3 - after.totalGasM3
  const elecSaved = before.totalElectricityFromGridKwh - after.totalElectricityFromGridKwh
  return {
    gasSavedM3: gasSaved,
    electricitySavedFromGridKwh: elecSaved,
    annualSavingEuro: before.totalCostEuro - after.totalCostEuro,
    co2SavedTonnes: Math.round((before.totalCo2Tonnes - after.totalCo2Tonnes) * 10) / 10,
    gasReductionPercent: before.totalGasM3 > 0
      ? Math.round((gasSaved / before.totalGasM3) * 100) : 0,
    electricitySelfProducedPercent: after.selfConsumedKwh > before.selfConsumedKwh
      ? Math.round(((after.selfConsumedKwh - before.selfConsumedKwh) / Math.max(1, after.applianceKwh + after.heating.electricityKwh + after.hotWater.electricityKwh)) * 100)
      : 0,
  }
}

// ---------------------------------------------------------------------------
// Financial computation
// ---------------------------------------------------------------------------

function computeFinancials(
  diff: ModelDiff,
  costMin: number,
  costMax: number,
  subsidies: Subsidy[],
  lifespanYears: number,
) {
  const annualSaving = Math.max(0, diff.annualSavingEuro)

  const totalSubsidy = subsidies.reduce((s, sub) => s + sub.amount, 0)
  const netCostMin = Math.max(0, costMin - totalSubsidy)
  const netCostMax = Math.max(0, costMax - totalSubsidy)

  const avgNetCost = (netCostMin + netCostMax) / 2
  const paybackYears = annualSaving > 0 ? Math.round((avgNetCost / annualSaving) * 10) / 10 : 99
  const paidOffYear = CURRENT_YEAR + Math.ceil(paybackYears)
  const freeSavingsYears = Math.max(0, lifespanYears - Math.ceil(paybackYears))
  const totalReturn = Math.round(annualSaving * freeSavingsYears)

  return {
    costMin, costMax, subsidies, netCostMin, netCostMax,
    monthlySaving: Math.round(annualSaving / 12),
    annualSaving,
    paybackYears, paidOffYear, freeSavingsYears, totalReturn,
    co2SavedTonnesPerYear: diff.co2SavedTonnes,
    co2TreesEquivalent: co2ToTrees(diff.co2SavedTonnes),
    gasReductionPercent: diff.gasReductionPercent,
    electricitySelfProducedPercent: diff.electricitySelfProducedPercent,
    savedGasM3PerYear: diff.gasSavedM3,
    savedKwhPerYear: diff.electricitySavedFromGridKwh,
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function calculateRecommendations(
  profile: HomeProfile,
  province: string,
  municipality?: string,
  scenario: PriceScenario = 'current'
): UpgradeResult[] {
  const prices = getScenarioPrices(scenario, profile)
  const currentModel = buildEnergyModel(profile, province, [], prices)

  const stories = inferStories(profile.buildingType, profile.floorArea)
  const groundFloorArea = profile.floorArea / stories
  const areaRatios: Record<string, { wall: number; roof: number; window: number }> = {
    detached:       { wall: 1.0,  roof: 0.8,  window: 0.18 },
    'semi-detached': { wall: 0.85, roof: 0.75, window: 0.16 },
    corner:         { wall: 0.85, roof: 0.7,  window: 0.16 },
    terraced:       { wall: 0.6,  roof: 0.7,  window: 0.15 },
    apartment:      { wall: 0.4,  roof: 0.3,  window: 0.12 },
  }
  const ratios = areaRatios[profile.buildingType] ?? areaRatios.terraced
  const wallArea = profile.floorArea * ratios.wall
  const roofArea = groundFloorArea * ratios.roof
  const floorAreaM2 = groundFloorArea
  const windowArea = profile.floorArea * ratios.window

  const results: UpgradeResult[] = []

  const existing = profile.existingUpgrades
  const skipIds = new Set<string>()
  if (existing?.solarPanels?.has) skipIds.add('solar-panels')
  if (existing?.heatPump?.has) skipIds.add('heat-pump')
  if (existing?.homeBattery?.has) skipIds.add('home-battery')
  if (profile.heatingType === 'heat-pump-air' || profile.heatingType === 'heat-pump-ground') {
    skipIds.add('heat-pump')
  }

  for (const def of upgradeDefs.upgrades) {
    const upgradeId = def.id as UpgradeResult['id']
    if (skipIds.has(upgradeId)) continue
    const blockedForVvE = profile.isVvE && isBlockedForVvE(def.requiresExteriorAccess)
    const restrictions = getRestrictions(upgradeId, profile)
    const isBlocked = restrictions.some(r => r.type === 'blocked')
    const defAny = def as { tiers?: { tierId: string; labelNl: string; labelEn: string; params: Record<string, number>; costMultiplier: number; legacyId?: string }[]; tierInfoNl?: string; tierInfoEn?: string }
    const tiers = defAny.tiers

    if (tiers && tiers.length > 0) {
      const tierResults: TierResult[] = []

      for (const tier of tiers) {
        if (upgradeId === 'heat-pump') {
          if (tier.tierId === 'ground-source' && profile.buildingType === 'apartment') continue
          if (tier.tierId === 'hybrid' && profile.heatingType === 'hybrid-heat-pump') continue
        }

        const afterModel = buildEnergyModel(
          profile, province,
          [{ id: upgradeId, tierId: tier.tierId, params: tier.params }],
          prices,
        )
        const diff = diffModels(currentModel, afterModel)

        if (diff.annualSavingEuro <= 0 && upgradeId !== 'solar-panels') continue

        const relevantArea = upgradeId.includes('wall') ? wallArea
          : upgradeId === 'roof-insulation' ? roofArea
          : upgradeId === 'floor-insulation' ? floorAreaM2
          : upgradeId === 'glazing' ? windowArea : REFERENCE_FLOOR_AREA
        const baseTierCostMin = Math.round(def.costMinBase * tier.costMultiplier)
        const baseTierCostMax = Math.round(def.costMaxBase * tier.costMultiplier)
        const { costMin: tierCostMin, costMax: tierCostMax } = scaleUpgradeCost(upgradeId, baseTierCostMin, baseTierCostMax, relevantArea)
        const subsidyLookupId = (tier.legacyId ?? upgradeId) as UpgradeResult['id']
        const subsidies = getSubsidies(subsidyLookupId, province, municipality, tier.params, profile.yearBuilt)

        const fin = computeFinancials(diff, tierCostMin, tierCostMax, subsidies, def.lifespanYears)
        const epcDelta = EPC_DELTA[tier.legacyId ?? upgradeId] ?? EPC_DELTA[upgradeId] ?? 0

        let labelNl = tier.labelNl
        let labelEn = tier.labelEn
        if (upgradeId === 'solar-panels') {
          const maxKwp = Math.min(Math.floor(roofArea / 6), 20)
          const panelCount = Math.max(1, Math.round(maxKwp * (tier.params.coveragePct ?? 1))) * 2
          labelNl = `${panelCount} panelen`
          labelEn = `${panelCount} panels`
        }

        tierResults.push({
          tierId: tier.tierId,
          labelNl,
          labelEn,
          params: tier.params,
          epcDelta,
          ...fin,
        })
      }

      if (tierResults.length === 0) continue

      const bestIdx = tierResults.reduce((bi, t, i) => {
        const tNet = t.annualSaving * 20 - Math.round((t.netCostMin + t.netCostMax) / 2)
        const bNet = tierResults[bi].annualSaving * 20 - Math.round((tierResults[bi].netCostMin + tierResults[bi].netCostMax) / 2)
        return tNet > bNet ? i : bi
      }, 0)
      const bestTier = tierResults[bestIdx]

      const requiredBefore = getRequiredBefore(upgradeId).map(r => r.upgradeId)
      const synergies = getSynergies(upgradeId).map(s => ({
        upgradeId: s.upgradeId,
        saving: `${s.savingPercent}%`,
      }))

      results.push({
        id: upgradeId,
        rank: 0,
        tag: getTag(bestTier.paybackYears, bestTier.co2SavedTonnesPerYear, bestTier.annualSaving),
        description: def.descriptionNl,
        descriptionEn: def.descriptionEn,
        costMin: bestTier.costMin,
        costMax: bestTier.costMax,
        subsidies: bestTier.subsidies,
        netCostMin: bestTier.netCostMin,
        netCostMax: bestTier.netCostMax,
        monthlySaving: bestTier.monthlySaving,
        annualSaving: bestTier.annualSaving,
        paybackYears: bestTier.paybackYears,
        lifespanYears: def.lifespanYears,
        paidOffYear: bestTier.paidOffYear,
        totalReturn: bestTier.totalReturn,
        freeSavingsYears: bestTier.freeSavingsYears,
        co2SavedTonnesPerYear: bestTier.co2SavedTonnesPerYear,
        co2TreesEquivalent: bestTier.co2TreesEquivalent,
        gasReductionPercent: bestTier.gasReductionPercent,
        electricitySelfProducedPercent: bestTier.electricitySelfProducedPercent,
        savedGasM3PerYear: bestTier.savedGasM3PerYear,
        savedKwhPerYear: bestTier.savedKwhPerYear,
        requiresBefore: requiredBefore,
        benefitsFrom: synergies,
        blockedForVvE: blockedForVvE || isBlocked,
        restrictions: restrictions.length > 0 ? restrictions : undefined,
        dataSource: profile.dataSource,
        difficulty: def.difficulty as 'diy' | 'professional',
        installDays: def.installDays,
        tiers: tierResults,
        selectedTierId: bestTier.tierId,
        tierInfoNl: defAny.tierInfoNl,
        tierInfoEn: defAny.tierInfoEn,
      })
    } else {
      // Non-tiered upgrade
      const afterModel = buildEnergyModel(
        profile, province,
        [{ id: upgradeId }],
        prices,
      )
      const diff = diffModels(currentModel, afterModel)

      if (diff.annualSavingEuro <= 0 && upgradeId !== 'solar-panels') continue

      const relevantArea = upgradeId.includes('wall') ? wallArea
        : upgradeId === 'roof-insulation' ? roofArea
        : upgradeId === 'floor-insulation' ? floorAreaM2
        : upgradeId === 'glazing' ? windowArea : REFERENCE_FLOOR_AREA
      const { costMin: scaledCostMin, costMax: scaledCostMax } = scaleUpgradeCost(upgradeId, def.costMinBase, def.costMaxBase, relevantArea)
      const subsidies = getSubsidies(upgradeId, province, municipality, undefined, profile.yearBuilt)
      const fin = computeFinancials(diff, scaledCostMin, scaledCostMax, subsidies, def.lifespanYears)

      const requiredBefore = getRequiredBefore(upgradeId).map(r => r.upgradeId)
      const synergies = getSynergies(upgradeId).map(s => ({
        upgradeId: s.upgradeId,
        saving: `${s.savingPercent}%`,
      }))

      results.push({
        id: upgradeId,
        rank: 0,
        tag: getTag(fin.paybackYears, fin.co2SavedTonnesPerYear, fin.annualSaving),
        description: def.descriptionNl,
        descriptionEn: def.descriptionEn,
        ...fin,
        lifespanYears: def.lifespanYears,
        requiresBefore: requiredBefore,
        benefitsFrom: synergies,
        blockedForVvE: blockedForVvE || isBlocked,
        restrictions: restrictions.length > 0 ? restrictions : undefined,
        dataSource: profile.dataSource,
        difficulty: def.difficulty as 'diy' | 'professional',
        installDays: def.installDays,
      })
    }
  }

  // Post-processing: mutual exclusions
  if (results.some(r => r.id === 'heat-pump')) {
    const hwIdx = results.findIndex(r => r.id === 'hot-water-heat-pump')
    if (hwIdx !== -1) results.splice(hwIdx, 1)
  }
  const hasSolarExisting = existing?.solarPanels?.has
  if (!hasSolarExisting && !results.some(r => r.id === 'solar-panels')) {
    const batteryIdx = results.findIndex(r => r.id === 'home-battery')
    if (batteryIdx !== -1) results.splice(batteryIdx, 1)
  }

  if (profile.heatingType === 'district-heating') {
    const toRemove = new Set(['heat-pump', 'hot-water-heat-pump'])
    for (let i = results.length - 1; i >= 0; i--) {
      if (toRemove.has(results[i].id)) results.splice(i, 1)
    }
  }

  results.sort((a, b) => b.annualSaving - a.annualSaving)
  results.forEach((r, i) => { r.rank = i + 1 })

  return results
}
