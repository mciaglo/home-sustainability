import type { CountryAdapter, BuildingData, AddressHints } from '@/types/country-adapter'
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

function estimateEnergyCost(yearBuilt: number, floorArea: number, buildingType?: string): { gasM3: number; kWh: number; cost: number } {
  const era = getEraForYear(yearBuilt)
  // Rough national averages adjusted for build era and size
  const baseGasM3 = era?.id === 'pre-1920' ? 2800
    : era?.id === '1920-1945' ? 2400
    : era?.id === '1946-1974' ? 2000
    : era?.id === '1975-1991' ? 1700
    : era?.id === '1992-2005' ? 1400
    : era?.id === '2006-2014' ? 1000
    : 600 // 2015+

  const baseKwh = buildingType === 'apartment' ? 2400
    : buildingType === 'terraced' || buildingType === 'corner' ? 3000
    : buildingType === 'semi-detached' ? 3200
    : 3600

  const sizeMultiplier = floorArea / 100 // normalised to 100m²
  const gasM3 = Math.round(baseGasM3 * sizeMultiplier)
  const kWh = Math.round(baseKwh * sizeMultiplier)
  const cost = Math.round(gasM3 * energyPrices.gasEuroPerM3 + kWh * energyPrices.electricityEuroPerKwh)

  return { gasM3, kWh, cost }
}

interface BagWfsProperties {
  identificatie: string
  oppervlakte: number
  status: string
  gebruiksdoel: string
  openbare_ruimte: string
  huisnummer: number
  huisletter: string
  toevoeging: string
  postcode: string
  woonplaats: string
  bouwjaar: number
  pandidentificatie: string
  pandstatus: string
}

interface BagResult {
  identificatie: string
  oppervlakte: number
  gebruiksdoel: string
  bouwjaar: number
  dwellingCount?: number
  openbare_ruimte?: string
  huisnummer?: string
  postcode?: string
  woonplaats?: string
}

function inferBuildingType(gebruiksdoel: string, oppervlakte: number, dwellingCount?: number): string {
  if (gebruiksdoel.includes('woonfunctie')) {
    if (dwellingCount != null && dwellingCount > 1) return 'apartment'
    if (dwellingCount == null && oppervlakte < 80) return 'apartment'
    if (oppervlakte > 200) return 'detached'
    if (oppervlakte >= 130) return 'semi-detached'
    return 'terraced'
  }
  return 'detached'
}

const BAG_API_BASE = 'https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2'

async function fetchBAGKadaster(vboId: string): Promise<BagResult | null> {
  const apiKey = process.env.BAG_API_KEY
  if (!apiKey) return null

  const headers: Record<string, string> = {
    'X-Api-Key': apiKey,
    'Accept': 'application/hal+json',
  }

  try {
    const vboRes = await fetch(`${BAG_API_BASE}/verblijfsobjecten/${vboId}`, { headers })
    if (!vboRes.ok) return null

    const vboData = await vboRes.json()
    const vbo = vboData?.verblijfsobject
    if (!vbo) return null

    const pandId = vbo.pandIdentificaties?.[0]
    if (!pandId) return null

    const [pandRes, countRes] = await Promise.all([
      fetch(`${BAG_API_BASE}/panden/${pandId}`, { headers }),
      fetch(`${BAG_API_BASE}/verblijfsobjecten?pandIdentificatie=${pandId}&pageSize=1`, { headers }),
    ])

    let bouwjaar = 0
    if (pandRes.ok) {
      const pandData = await pandRes.json()
      bouwjaar = pandData?.pand?.oorspronkelijkBouwjaar ?? 0
    }

    let dwellingCount = 1
    if (countRes.ok) {
      const countData = await countRes.json()
      dwellingCount = countData?.page?.totalElements ??
        countData?._embedded?.verblijfsobjecten?.length ?? 1
    }

    return {
      identificatie: vbo.identificatie,
      oppervlakte: vbo.oppervlakte,
      gebruiksdoel: (vbo.gebruiksdoelen ?? []).join(', '),
      bouwjaar,
      dwellingCount,
    }
  } catch {
    return null
  }
}

async function fetchBAGPdok(vboId: string): Promise<BagResult | null> {
  const filter = `<Filter><PropertyIsEqualTo><PropertyName>identificatie</PropertyName><Literal>${vboId}</Literal></PropertyIsEqualTo></Filter>`
  const url = new URL('https://service.pdok.nl/lv/bag/wfs/v2_0')
  url.searchParams.set('service', 'WFS')
  url.searchParams.set('version', '2.0.0')
  url.searchParams.set('request', 'GetFeature')
  url.searchParams.set('typeName', 'bag:verblijfsobject')
  url.searchParams.set('outputFormat', 'application/json')
  url.searchParams.set('count', '1')
  url.searchParams.set('Filter', filter)

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = await res.json()
  const props = data?.features?.[0]?.properties as BagWfsProperties | undefined
  if (!props) return null

  return {
    identificatie: props.identificatie,
    oppervlakte: props.oppervlakte,
    gebruiksdoel: props.gebruiksdoel,
    bouwjaar: props.bouwjaar,
    openbare_ruimte: props.openbare_ruimte,
    huisnummer: String(props.huisnummer) + (props.huisletter ?? '') + (props.toevoeging ? `-${props.toevoeging}` : ''),
    postcode: props.postcode,
    woonplaats: props.woonplaats,
  }
}

async function fetchBAG(vboId: string): Promise<BagResult | null> {
  const kadaster = await fetchBAGKadaster(vboId)
  if (kadaster) return kadaster
  return fetchBAGPdok(vboId)
}

interface EpOnlineResult {
  Energieklasse?: string
  Gebouwtype?: string
  Gebouwsubtype?: string
  Gebouwklasse?: string
  Gebruiksoppervlakte_thermische_zone?: number
  Energiebehoefte?: number
  PrimaireFossieleEnergie?: number
  Aandeel_hernieuwbare_energie?: number
  BerekendeCO2Emissie?: number
  BerekendeEnergieverbruik?: number
}

function parseEnergyLabel(klasse: string | undefined): EnergyLabel {
  if (!klasse) return 'unknown'
  const normalized = klasse.trim().toUpperCase()
  const valid: EnergyLabel[] = ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
  return valid.includes(normalized as EnergyLabel) ? (normalized as EnergyLabel) : 'unknown'
}

async function fetchEPOnline(bagVboId: string): Promise<{ label: EnergyLabel; registered: boolean; epData?: EpOnlineResult }> {
  const apiKey = process.env.RVO_API_KEY
  if (!apiKey) return { label: 'unknown', registered: false }

  try {
    const res = await fetch(
      `https://public.ep-online.nl/api/v5/PandEnergielabel/AdresseerbaarObject/${bagVboId}`,
      { headers: { 'Authorization': apiKey } }
    )
    if (!res.ok) return { label: 'unknown', registered: false }

    const data: EpOnlineResult[] = await res.json()
    if (!data.length) return { label: 'unknown', registered: false }

    const latest = data[0]
    return {
      label: parseEnergyLabel(latest.Energieklasse),
      registered: true,
      epData: latest,
    }
  } catch {
    return { label: 'unknown', registered: false }
  }
}

// TODO: replace with real CBS Statline API call
async function mockFetchNeighbourLabel(postcode: string): Promise<EnergyLabel | null> {
  void postcode
  return null
}

const LABEL_RANK: Record<string, number> = {
  'A+++': 10, 'A++': 9, 'A+': 8, 'A': 7, 'B': 6, 'C': 5, 'D': 4, 'E': 3, 'F': 2, 'G': 1, 'unknown': 0,
}

function expectedLabelForEra(yearBuilt: number): number {
  if (yearBuilt < 1946) return LABEL_RANK['F']
  if (yearBuilt < 1975) return LABEL_RANK['E']
  if (yearBuilt < 1992) return LABEL_RANK['D']
  if (yearBuilt < 2006) return LABEL_RANK['C']
  if (yearBuilt < 2015) return LABEL_RANK['B']
  return LABEL_RANK['A']
}

function upgradeLevel(level: InsulationLevel): InsulationLevel {
  if (level === 'none') return 'partial'
  if (level === 'partial') return 'good'
  if (level === 'good') return 'very-good'
  return level
}

function adjustInsulationForLabel(
  eraInsulation: { wall: InsulationLevel; roof: InsulationLevel; floor: InsulationLevel; glazing: InsulationLevel },
  label: EnergyLabel,
  yearBuilt: number,
): { wall: InsulationLevel; roof: InsulationLevel; floor: InsulationLevel; glazing: InsulationLevel } {
  const actual = LABEL_RANK[label] ?? 0
  const expected = expectedLabelForEra(yearBuilt)
  const gap = actual - expected

  if (gap <= 0) return eraInsulation

  const result = { ...eraInsulation }
  // Each label step above expected implies ~1 insulation element was upgraded
  const elements: (keyof typeof result)[] = ['wall', 'roof', 'glazing', 'floor']
  for (let i = 0; i < Math.min(gap, elements.length); i++) {
    result[elements[i]] = upgradeLevel(result[elements[i]])
  }
  return result
}

function inferHeatingType(eraHeating: HeatingType, label: EnergyLabel): HeatingType {
  const rank = LABEL_RANK[label] ?? 0
  if (rank >= LABEL_RANK['A'] && eraHeating === 'gas-boiler') return 'heat-pump-air'
  return eraHeating
}

export const nlAdapter: CountryAdapter = {
  countryCode: 'NL',

  async fetchBuildingData(address: string, hints?: AddressHints): Promise<BuildingData> {
    if (hints?.bagVboId) {
      const bag = await fetchBAG(hints.bagVboId)
      if (bag) {
        const isVvE = bag.dwellingCount != null
          ? bag.dwellingCount > 1
          : (bag.gebruiksdoel.includes('woonfunctie') && bag.oppervlakte < 60)

        return {
          bagId: bag.identificatie,
          yearBuilt: bag.bouwjaar,
          floorArea: bag.oppervlakte,
          buildingType: inferBuildingType(bag.gebruiksdoel, bag.oppervlakte, bag.dwellingCount),
          isMonument: false,
          isVvE,
          lat: hints.lat ?? 0,
          lng: hints.lng ?? 0,
          postcode: hints.postcode ?? bag.postcode ?? '',
          city: hints.city ?? bag.woonplaats ?? '',
          street: bag.openbare_ruimte ?? address,
          houseNumber: bag.huisnummer ?? '',
        }
      }
    }

    // Fallback: no BAG data available
    return {
      bagId: undefined,
      yearBuilt: 1975,
      floorArea: 100,
      buildingType: 'terraced',
      isMonument: false,
      isVvE: false,
      lat: hints?.lat ?? 0,
      lng: hints?.lng ?? 0,
      postcode: hints?.postcode ?? '',
      city: hints?.city ?? '',
      street: address,
      houseNumber: '',
    }
  },

  async fetchEnergyLabel(bagId: string) {
    return fetchEPOnline(bagId)
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
    const energy = estimateEnergyCost(buildingData.yearBuilt, buildingData.floorArea, buildingData.buildingType)

    // If EP-online returned no label, estimate from build era
    const RANK_TO_LABEL: Record<number, EnergyLabel> = {
      10: 'A+++', 9: 'A++', 8: 'A+', 7: 'A', 6: 'B', 5: 'C', 4: 'D', 3: 'E', 2: 'F', 1: 'G',
    }
    let effectiveLabel = energyLabel
    let labelRegistered = true
    let dataSource: HomeProfile['dataSource'] = 'ep-online'

    if (energyLabel === 'unknown') {
      const rank = expectedLabelForEra(buildingData.yearBuilt)
      effectiveLabel = RANK_TO_LABEL[rank] ?? 'D'
      labelRegistered = false
      dataSource = 'build-era-lookup'
    }

    const eraInsulation = era?.insulation ?? {
      wall: 'unknown' as InsulationLevel, roof: 'unknown' as InsulationLevel,
      floor: 'unknown' as InsulationLevel, glazing: 'unknown' as InsulationLevel,
    }

    // If the energy label is better than expected for the build era, infer upgrades were done
    const insulation = adjustInsulationForLabel(eraInsulation, effectiveLabel, buildingData.yearBuilt)

    const heatingType = inferHeatingType(era?.typicalHeating ?? 'unknown', effectiveLabel)

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
      energyLabel: effectiveLabel,
      energyLabelRegistered: labelRegistered,
      insulation,
      heatingType,
      estimatedGasM3PerYear: energy.gasM3,
      estimatedElectricityKwhPerYear: energy.kWh,
      estimatedEnergyCostPerYear: energy.cost,
      hasGridCongestion: false,
      dataSource,
      hasUploadedBill: false,
      userCorrected: false,
    }
  },
}
