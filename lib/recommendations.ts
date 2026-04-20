import type { HomeProfile } from '@/types/home-profile'
import type { UpgradeResult, UpgradeTag, PriceScenario, TierResult, Subsidy } from '@/types/upgrade'
import uValues from '@/data/static/nta8800-u-values.json'
import upgradeDefs from '@/data/static/upgrade-definitions.json'
import energyPrices from '@/data/cached/energy-prices.json'
import { gasCo2SavedTonnes, electricityCo2SavedTonnes, co2ToTrees } from './co2'
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

function getScenarioPrices(scenario: PriceScenario, profile?: { contractGasEuroPerM3?: number; contractElectricityEuroPerKwh?: number }): { gas: number; electricity: number } {
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
  'cavity-wall-insulation': 1,
  'external-wall-insulation': 2,
  'roof-insulation': 1,
  'floor-insulation': 1,
  'hr-plus-plus-glazing': 1,
  'triple-glazing': 1,
  'glazing': 1,
  'solar-panels': 1,
  'heat-pump-air': 2,
  'heat-pump-ground': 2,
  'heat-pump': 2,
  'hot-water-heat-pump': 1,
  'draught-proofing': 0,
  'smart-thermostat': 0,
  'mechanical-ventilation': 0,
  'home-battery': 0,
}

interface EnergySavings {
  savedGasM3PerYear: number
  savedKwhPerYear: number
}

function calculateInsulationSavings(
  uBefore: number, uAfter: number, area: number, heatingDegreeDays: number
): EnergySavings {
  if (uBefore <= uAfter) return { savedGasM3PerYear: 0, savedKwhPerYear: 0 }
  const heatLossReduction = (uBefore - uAfter) * area
  const savedKwh = (heatLossReduction * heatingDegreeDays * 24) / 1000
  return { savedGasM3PerYear: savedKwh / 8.8, savedKwhPerYear: 0 }
}

function calculateUpgradeSavings(
  upgradeId: string,
  profile: HomeProfile,
  refUValues: { wall: number; roof: number; floor: number; glazing: number },
  wallArea: number, roofArea: number, floorAreaM2: number, windowArea: number,
  heatingDegreeDays: number,
  gasPrice: number, electricityPrice: number,
  tierParams?: Record<string, number>
): EnergySavings {
  let savedGasM3PerYear = 0
  let savedKwhPerYear = 0

  const targetUValues = uValues.targets as unknown as Record<string, Record<string, number>>

  switch (upgradeId) {
    case 'cavity-wall-insulation':
    case 'external-wall-insulation': {
      const uAfter = targetUValues[upgradeId]?.wall ?? 0.35
      return calculateInsulationSavings(refUValues.wall, uAfter, wallArea, heatingDegreeDays)
    }
    case 'roof-insulation': {
      const uAfter = tierParams?.uValue ?? targetUValues['roof-insulation']?.roof ?? 0.20
      return calculateInsulationSavings(refUValues.roof, uAfter, roofArea, heatingDegreeDays)
    }
    case 'floor-insulation': {
      const uAfter = tierParams?.uValue ?? targetUValues['floor-insulation']?.floor ?? 0.22
      return calculateInsulationSavings(refUValues.floor, uAfter, floorAreaM2, heatingDegreeDays)
    }
    case 'glazing': {
      const uAfter = tierParams?.uValue ?? 1.2
      return calculateInsulationSavings(refUValues.glazing, uAfter, windowArea, heatingDegreeDays)
    }
    case 'draught-proofing': {
      savedGasM3PerYear = profile.estimatedGasM3PerYear * 0.07
      break
    }
    case 'smart-thermostat': {
      savedGasM3PerYear = profile.estimatedGasM3PerYear * 0.12
      break
    }
    case 'solar-panels': {
      const irradiance = profile.solarIrradianceKwhM2Year ?? 950
      const maxKwp = Math.min(Math.floor(roofArea / 6), 10)
      const coveragePct = tierParams?.coveragePct ?? 1.0
      const systemSizeKwp = Math.max(1, Math.round(maxKwp * coveragePct))
      savedKwhPerYear = irradiance * systemSizeKwp * 0.85
      break
    }
    case 'heat-pump': {
      const cop = tierParams?.cop ?? 3.0
      const currentGasKwh = profile.estimatedGasM3PerYear * 8.8
      savedGasM3PerYear = profile.estimatedGasM3PerYear
      savedKwhPerYear = -(currentGasKwh / cop)
      break
    }
    case 'hot-water-heat-pump': {
      const hotWaterGasM3 = profile.estimatedGasM3PerYear * 0.20
      savedGasM3PerYear = hotWaterGasM3
      savedKwhPerYear = -(hotWaterGasM3 * 8.8 / 2.5)
      break
    }
    case 'home-battery': {
      const batteryCapacityKwh = tierParams?.capacityKwh ?? 10
      const cyclesPerYear = 300
      const feedInRate = 0.07
      const selfUseValue = electricityPrice - feedInRate
      const storedKwh = batteryCapacityKwh * cyclesPerYear * 0.85
      const batterySaving = storedKwh * selfUseValue
      savedGasM3PerYear = batterySaving / gasPrice
      break
    }
    default:
      break
  }

  return { savedGasM3PerYear, savedKwhPerYear }
}

function computeFinancials(
  savings: EnergySavings,
  gasPrice: number,
  electricityPrice: number,
  costMin: number,
  costMax: number,
  subsidies: Subsidy[],
  lifespanYears: number,
  profile: HomeProfile
) {
  const { savedGasM3PerYear, savedKwhPerYear } = savings

  const annualSaving = Math.round(
    savedGasM3PerYear * gasPrice - (savedKwhPerYear < 0 ? Math.abs(savedKwhPerYear) * electricityPrice : 0) +
    (savedKwhPerYear > 0 ? savedKwhPerYear * electricityPrice : 0)
  )

  const totalSubsidy = subsidies.reduce((s, sub) => s + sub.amount, 0)
  const netCostMin = Math.max(0, costMin - totalSubsidy)
  const netCostMax = Math.max(costMin, costMax - totalSubsidy)

  const avgNetCost = (netCostMin + netCostMax) / 2
  const paybackYears = annualSaving > 0 ? Math.round((avgNetCost / annualSaving) * 10) / 10 : 99
  const paidOffYear = CURRENT_YEAR + Math.ceil(paybackYears)
  const freeSavingsYears = Math.max(0, lifespanYears - Math.ceil(paybackYears))
  const totalReturn = Math.round(annualSaving * freeSavingsYears)

  const co2Tonnes = Math.round(
    (gasCo2SavedTonnes(savedGasM3PerYear) + electricityCo2SavedTonnes(Math.max(0, savedKwhPerYear))) * 10
  ) / 10

  return {
    costMin, costMax, subsidies, netCostMin, netCostMax,
    monthlySaving: Math.round(annualSaving / 12),
    annualSaving, paybackYears, paidOffYear, freeSavingsYears, totalReturn,
    co2SavedTonnesPerYear: co2Tonnes,
    co2TreesEquivalent: co2ToTrees(co2Tonnes),
    gasReductionPercent: profile.estimatedGasM3PerYear > 0
      ? Math.round((savedGasM3PerYear / profile.estimatedGasM3PerYear) * 100) : 0,
    electricitySelfProducedPercent: savedKwhPerYear > 0 && profile.estimatedElectricityKwhPerYear > 0
      ? Math.round((savedKwhPerYear / profile.estimatedElectricityKwhPerYear) * 100) : 0,
  }
}

export function calculateRecommendations(
  profile: HomeProfile,
  province: string,
  municipality?: string,
  scenario: PriceScenario = 'current'
): UpgradeResult[] {
  const era = getBuildEra(profile.yearBuilt)
  const refUValues = uValues.reference[era]
  const prices = getScenarioPrices(scenario, profile)
  const gasPrice = prices.gas
  const electricityPrice = prices.electricity

  const wallArea = profile.floorArea * 0.8
  const roofArea = profile.floorArea * 0.7
  const floorAreaM2 = profile.floorArea
  const windowArea = profile.floorArea * 0.15
  const heatingDegreeDays = 2750

  const results: UpgradeResult[] = []

  for (const def of upgradeDefs.upgrades) {
    const upgradeId = def.id as UpgradeResult['id']
    const blockedForVvE = profile.isVvE && isBlockedForVvE(def.requiresExteriorAccess)
    const defAny = def as { tiers?: { tierId: string; labelNl: string; labelEn: string; params: Record<string, number>; costMultiplier: number; legacyId?: string }[]; tierInfoNl?: string; tierInfoEn?: string }
    const tiers = defAny.tiers

    if (tiers && tiers.length > 0) {
      const tierResults: TierResult[] = []

      for (const tier of tiers) {
        const savings = calculateUpgradeSavings(
          upgradeId, profile, refUValues,
          wallArea, roofArea, floorAreaM2, windowArea,
          heatingDegreeDays, gasPrice, electricityPrice,
          tier.params
        )

        if (savings.savedGasM3PerYear === 0 && savings.savedKwhPerYear === 0) continue

        const tierCostMin = Math.round(def.costMinBase * tier.costMultiplier)
        const tierCostMax = Math.round(def.costMaxBase * tier.costMultiplier)
        const subsidyLookupId = (tier.legacyId ?? upgradeId) as UpgradeResult['id']
        const subsidies = getSubsidies(subsidyLookupId, province, municipality)

        const fin = computeFinancials(
          savings, gasPrice, electricityPrice,
          tierCostMin, tierCostMax, subsidies,
          def.lifespanYears, profile
        )

        if (fin.annualSaving <= 0 && upgradeId !== 'solar-panels') continue

        const epcDelta = EPC_DELTA[tier.legacyId ?? upgradeId] ?? EPC_DELTA[upgradeId] ?? 0

        let labelNl = tier.labelNl
        let labelEn = tier.labelEn
        if (upgradeId === 'solar-panels') {
          const maxKwp = Math.min(Math.floor(roofArea / 6), 10)
          const panelCount = Math.max(1, Math.round(maxKwp * (tier.params.coveragePct ?? 1))) * 2
          labelNl = `${panelCount} panelen`
          labelEn = `${panelCount} panels`
        }

        tierResults.push({
          tierId: tier.tierId,
          labelNl,
          labelEn,
          epcDelta,
          ...fin,
        })
      }

      if (tierResults.length === 0) continue

      // Auto-select tier with best payback (balance of cost vs savings)
      const bestTier = tierResults.reduce((best, t) =>
        t.paybackYears < best.paybackYears ? t : best
      , tierResults[0])

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
        requiresBefore: requiredBefore,
        benefitsFrom: synergies,
        blockedForVvE,
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
      const savings = calculateUpgradeSavings(
        upgradeId, profile, refUValues,
        wallArea, roofArea, floorAreaM2, windowArea,
        heatingDegreeDays, gasPrice, electricityPrice
      )

      const annualSaving = Math.round(
        savings.savedGasM3PerYear * gasPrice
        - (savings.savedKwhPerYear < 0 ? Math.abs(savings.savedKwhPerYear) * electricityPrice : 0)
        + (savings.savedKwhPerYear > 0 ? savings.savedKwhPerYear * electricityPrice : 0)
      )

      if (annualSaving <= 0 && upgradeId !== 'solar-panels') continue

      const subsidies = getSubsidies(upgradeId, province, municipality)
      const fin = computeFinancials(
        savings, gasPrice, electricityPrice,
        def.costMinBase, def.costMaxBase, subsidies,
        def.lifespanYears, profile
      )

      const co2Tonnes = fin.co2SavedTonnesPerYear

      const requiredBefore = getRequiredBefore(upgradeId).map(r => r.upgradeId)
      const synergies = getSynergies(upgradeId).map(s => ({
        upgradeId: s.upgradeId,
        saving: `${s.savingPercent}%`,
      }))

      results.push({
        id: upgradeId,
        rank: 0,
        tag: getTag(fin.paybackYears, co2Tonnes, fin.annualSaving),
        description: def.descriptionNl,
        descriptionEn: def.descriptionEn,
        ...fin,
        lifespanYears: def.lifespanYears,
        requiresBefore: requiredBefore,
        benefitsFrom: synergies,
        blockedForVvE,
        dataSource: profile.dataSource,
        difficulty: def.difficulty as 'diy' | 'professional',
        installDays: def.installDays,
      })
    }
  }

  results.sort((a, b) => b.annualSaving - a.annualSaving)
  results.forEach((r, i) => { r.rank = i + 1 })

  return results
}
