export type UpgradeId =
  | 'draught-proofing'
  | 'smart-thermostat'
  | 'cavity-wall-insulation'
  | 'external-wall-insulation'
  | 'roof-insulation'
  | 'floor-insulation'
  | 'hr-plus-plus-glazing'
  | 'triple-glazing'
  | 'solar-panels'
  | 'heat-pump-air'
  | 'heat-pump-ground'
  | 'mechanical-ventilation'
  | 'hot-water-heat-pump'

export type UpgradeTag =
  | 'top-pick'
  | 'quick-win'
  | 'strong'
  | 'high-impact'
  | 'long-game'
  | 'comfort-boost'

export type PriceScenario = 'current' | 'peak2022' | 'conservative'

export interface Subsidy {
  name: string
  amount: number // €
  deadline: string | null
  url: string
}

export interface UpgradeResult {
  id: UpgradeId
  rank: number
  tag: UpgradeTag

  // Personalised description
  description: string

  // Financials
  costMin: number // € gross
  costMax: number // € gross
  subsidies: Subsidy[]
  netCostMin: number // € after subsidies
  netCostMax: number // € after subsidies
  monthlySaving: number // €/mo at current prices
  annualSaving: number // €/yr at current prices
  paybackYears: number
  lifespanYears: number
  paidOffYear: number
  totalReturn: number // € over lifespan after recoup
  freeSavingsYears: number

  // CO₂
  co2SavedTonnesPerYear: number
  co2DrivingKmEquivalent: number // km/yr

  // Energy independence
  gasReductionPercent: number
  electricitySelfProducedPercent: number

  // Property value
  propertyValueUpliftMin?: number // €
  propertyValueUpliftMax?: number // €

  // EPC delta
  epcLabelDelta?: number // number of label steps improved

  // Combination logic
  requiresBefore?: UpgradeId[] // must do these first
  benefitsFrom?: { upgradeId: UpgradeId; saving: string }[]
  blockedForVvE: boolean

  // Confidence
  dataSource: 'ep-online' | 'build-era-lookup' | 'user-override' | 'energy-bill'

  // Meta
  difficulty: 'diy' | 'professional'
  installDays: string // e.g. "1–2 days"
}

export interface UpgradeDefinition {
  id: UpgradeId
  nameNl: string
  nameEn: string
  descriptionNl: string
  descriptionEn: string
  costMinBase: number
  costMaxBase: number
  lifespanYears: number
  difficulty: 'diy' | 'professional'
  installDays: string
  requiresExteriorAccess: boolean
}
