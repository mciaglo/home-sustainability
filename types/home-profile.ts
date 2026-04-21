export type BuildingType = 'terraced' | 'semi-detached' | 'detached' | 'apartment' | 'corner'

export type EnergyLabel = 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'unknown'

export type InsulationLevel = 'none' | 'partial' | 'good' | 'very-good' | 'unknown'

export type HeatingType = 'gas-boiler' | 'heat-pump-air' | 'heat-pump-ground' | 'hybrid-heat-pump' | 'district-heating' | 'electric' | 'unknown'

export type DataSource = 'ep-online' | 'build-era-lookup' | 'user-override' | 'energy-bill'

export interface InsulationProfile {
  wall: InsulationLevel
  roof: InsulationLevel
  floor: InsulationLevel
  glazing: InsulationLevel
}

export interface HomeProfile {
  // Address
  address: string
  postcode: string
  city: string
  province?: string
  lat: number
  lng: number

  // Building data (BAG)
  bagId?: string
  yearBuilt: number
  floorArea: number // m²
  buildingType: BuildingType
  isMonument: boolean
  isVvE: boolean // apartment / owners association

  // Energy (EP-online)
  energyLabel: EnergyLabel
  energyLabelRegistered: boolean // true if official EP-online label

  // Inferred
  insulation: InsulationProfile
  heatingType: HeatingType
  estimatedGasM3PerYear: number
  estimatedElectricityKwhPerYear: number
  estimatedEnergyCostPerYear: number // €

  // Solar (PVGIS)
  roofOrientationDegrees?: number // 0 = north, 180 = south
  roofTiltDegrees?: number
  solarIrradianceKwhM2Year?: number

  // Neighbours (CBS)
  postcodeAverageLabel?: EnergyLabel

  // Grid
  hasGridCongestion: boolean

  // Energy contract
  contractGasEuroPerM3?: number
  contractElectricityEuroPerKwh?: number

  // Existing upgrades
  existingUpgrades?: {
    solarPanels?: { has: boolean; count?: number }
    heatPump?: { has: boolean; type?: 'air-source' | 'ground-source' }
    homeBattery?: { has: boolean }
  }

  // Data confidence
  dataSource: DataSource
  hasUploadedBill: boolean

  // User corrections applied
  userCorrected: boolean
}

export interface UserCorrections {
  yearBuilt?: number
  floorArea?: number
  buildingType?: BuildingType
  energyLabel?: EnergyLabel
  insulation?: Partial<InsulationProfile>
  heatingType?: HeatingType
  actualGasM3PerYear?: number
  actualElectricityKwhPerYear?: number
}
