/**
 * Netherlands country adapter.
 * In v1, BAG and EP-online calls return mock data.
 * Replace the mock sections with real API calls once keys are available.
 */
import type { CountryAdapter, BuildingData } from '@/types/country-adapter'
import type { HomeProfile, EnergyLabel, InsulationLevel, HeatingType } from '@/types/home-profile'
import buildEraData from '@/data/static/build-era-lookup.json'
import energyPrices from '@/data/cached/energy-prices.json'
import gridCongestion from '@/data/cached/grid-congestion.json'
import { getSubsidies as getSubsidiesFromFile } from '@/lib/subsidies'
import type { Subsidy, UpgradeId } from '@/types/upgrade'

interface BuildEra {
  id: string
  yearFrom: number
  yearTo: number
  insulation: { wall: InsulationLevel; roof: InsulationLevel; floor: InsulationLevel; glazing: InsulationLevel }
  typicalHeating: HeatingType
}

function getEraForYear(year: number): BuildEra | undefined {
  return (buildEraData.eras as BuildEra[]).find(e => year >= e.yearFrom && year <= e.yearTo)
}

function estimateEnergyCost(yearBuilt: number, floorArea: number): { gasM3: number; kWh: number; cost: number } {
  const era = getEraForYear(yearBuilt)
  // Rough national averages adjusted for build era and size
  const baseGasM3 = era?.id === 'pre-1920' ? 2800
    : era?.id === '1920-1945' ? 2400
    : era?.id === '1946-1974' ? 2000
    : era?.id === '1975-1991' ? 1700
    : era?.id === '1992-2005' ? 1400
    : era?.id === '2006-2014' ? 1000
    : 600 // 2015+

  const sizeMultiplier = floorArea / 100 // normalised to 100m²
  const gasM3 = Math.round(baseGasM3 * sizeMultiplier)
  const kWh = Math.round(3200 * sizeMultiplier) // rough average
  const cost = Math.round(gasM3 * energyPrices.gasEuroPerM3 + kWh * energyPrices.electricityEuroPerKwh)

  return { gasM3, kWh, cost }
}

// ---------------------------------------------------------------------------
// MOCK — replace with real BAG API call
// ---------------------------------------------------------------------------
async function mockFetchBAG(postcode: string, houseNumber: string): Promise<BuildingData> {
  return {
    bagId: `mock-${postcode}-${houseNumber}`,
    yearBuilt: 1975,
    floorArea: 112,
    buildingType: 'terraced',
    isMonument: false,
    isVvE: false,
    lat: 52.3702,
    lng: 4.8952,
    postcode,
    city: 'Amsterdam',
    street: 'Voorbeeldstraat',
    houseNumber,
  }
}

// ---------------------------------------------------------------------------
// MOCK — replace with real EP-online API call
// ---------------------------------------------------------------------------
async function mockFetchEPOnline(bagId: string): Promise<{ label: EnergyLabel; registered: boolean }> {
  void bagId
  return { label: 'E', registered: true }
}

// ---------------------------------------------------------------------------
// MOCK — replace with real CBS API call
// ---------------------------------------------------------------------------
async function mockFetchNeighbourLabel(postcode: string): Promise<EnergyLabel | null> {
  void postcode
  return 'D'
}

export const nlAdapter: CountryAdapter = {
  countryCode: 'NL',

  async fetchBuildingData(address: string): Promise<BuildingData> {
    // Parse postcode + house number from address string
    const match = address.match(/^(\d{4}\s?[A-Z]{2})\s+(\d+.*)$/i)
    const postcode = match?.[1]?.replace(/\s/, '') ?? '1000AA'
    const houseNumber = match?.[2] ?? '1'
    return mockFetchBAG(postcode, houseNumber)
  },

  async fetchEnergyLabel(bagId: string) {
    return mockFetchEPOnline(bagId)
  },

  async fetchNeighbourLabel(postcode: string) {
    return mockFetchNeighbourLabel(postcode)
  },

  async fetchGridCongestion(postcode: string): Promise<boolean> {
    const prefix = postcode.slice(0, 4)
    return gridCongestion.affectedPostcodes.includes(prefix)
  },

  getSubsidies(province: string, upgradeIds: UpgradeId[]): Subsidy[] {
    return upgradeIds.flatMap(id => getSubsidiesFromFile(id, province))
  },

  buildProfile(buildingData: BuildingData, energyLabel: EnergyLabel): Partial<HomeProfile> {
    const era = getEraForYear(buildingData.yearBuilt)
    const energy = estimateEnergyCost(buildingData.yearBuilt, buildingData.floorArea)

    return {
      bagId: buildingData.bagId,
      yearBuilt: buildingData.yearBuilt,
      floorArea: buildingData.floorArea,
      buildingType: buildingData.buildingType as HomeProfile['buildingType'],
      isMonument: buildingData.isMonument,
      isVvE: buildingData.isVvE,
      lat: buildingData.lat,
      lng: buildingData.lng,
      postcode: buildingData.postcode,
      city: buildingData.city,
      energyLabel,
      energyLabelRegistered: true,
      insulation: era?.insulation ?? {
        wall: 'unknown', roof: 'unknown', floor: 'unknown', glazing: 'unknown',
      },
      heatingType: era?.typicalHeating ?? 'unknown',
      estimatedGasM3PerYear: energy.gasM3,
      estimatedElectricityKwhPerYear: energy.kWh,
      estimatedEnergyCostPerYear: energy.cost,
      hasGridCongestion: false,
      dataSource: 'build-era-lookup',
      hasUploadedBill: false,
      userCorrected: false,
    }
  },
}
