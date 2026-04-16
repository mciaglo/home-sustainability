import type { HomeProfile } from './home-profile'
import type { EnergyLabel } from './home-profile'
import type { Subsidy, UpgradeId } from './upgrade'

export interface BuildingData {
  bagId?: string
  yearBuilt: number
  floorArea: number
  buildingType: string
  isMonument: boolean
  isVvE: boolean
  lat: number
  lng: number
  postcode: string
  city: string
  street: string
  houseNumber: string
}

export interface CountryAdapter {
  countryCode: string // 'NL' | 'DE' | 'FR' | 'BE'
  fetchBuildingData(address: string): Promise<BuildingData>
  fetchEnergyLabel(bagId: string): Promise<{ label: EnergyLabel; registered: boolean }>
  fetchNeighbourLabel(postcode: string): Promise<EnergyLabel | null>
  fetchGridCongestion(postcode: string): Promise<boolean>
  getSubsidies(province: string, upgradeIds: UpgradeId[]): Subsidy[]
  buildProfile(buildingData: BuildingData, energyLabel: EnergyLabel): Partial<HomeProfile>
}
