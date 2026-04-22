import { NextRequest, NextResponse } from 'next/server'
import { nlAdapter } from '@/lib/adapters/nl'
import type { HomeProfile } from '@/types/home-profile'

async function fetchSolarIrradiance(lat: number, lng: number): Promise<{ irradiance: number; fallback: boolean }> {
  if (!lat || !lng) return { irradiance: 950, fallback: true }
  try {
    const url = new URL('https://re.jrc.ec.europa.eu/api/v5_2/PVcalc')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('peakpower', '1')
    url.searchParams.set('loss', '14')
    url.searchParams.set('mountingplace', 'building')
    url.searchParams.set('angle', '35')
    url.searchParams.set('aspect', '0')
    url.searchParams.set('outputformat', 'json')

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
    if (!res.ok) throw new Error(`PVGIS ${res.status}`)

    const data = await res.json()
    const kwhPerKwp: number = data?.outputs?.totals?.fixed?.['E_y']
    if (!kwhPerKwp || kwhPerKwp < 100 || kwhPerKwp > 2000) throw new Error(`Unexpected value: ${kwhPerKwp}`)

    return { irradiance: Math.round(kwhPerKwp), fallback: false }
  } catch {
    return { irradiance: 950, fallback: true }
  }
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  const latParam = req.nextUrl.searchParams.get('lat')
  const lngParam = req.nextUrl.searchParams.get('lng')
  const bagVboId = req.nextUrl.searchParams.get('bagVboId')
  const postcode = req.nextUrl.searchParams.get('postcode')
  const province = req.nextUrl.searchParams.get('province')
  const city = req.nextUrl.searchParams.get('city')

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 })
  }

  try {
    // 1. Fetch building data (BAG)
    const buildingData = await nlAdapter.fetchBuildingData(address, {
      bagVboId: bagVboId ?? undefined,
      lat: latParam ? parseFloat(latParam) : undefined,
      lng: lngParam ? parseFloat(lngParam) : undefined,
      postcode: postcode ?? undefined,
      province: province ?? undefined,
      city: city ?? undefined,
    })

    // 2. Fetch energy label (EP-online) — use bagVboId directly if available, fall back to bagId from BAG
    const epId = bagVboId ?? buildingData.bagId ?? ''
    const { label, registered } = await nlAdapter.fetchEnergyLabel(epId)

    // 3. Build base profile
    const baseProfile = nlAdapter.buildProfile(buildingData, label)

    // 4. Check grid congestion + fetch solar irradiance (parallel)
    const lat = buildingData.lat
    const lng = buildingData.lng
    const [hasGridCongestion, solar] = await Promise.all([
      nlAdapter.fetchGridCongestion(buildingData.postcode),
      fetchSolarIrradiance(lat, lng),
    ])

    const profile: Partial<HomeProfile> = {
      ...baseProfile,
      address,
      energyLabelRegistered: registered,
      dataSource: registered ? 'ep-online' : 'build-era-lookup',
      hasGridCongestion,
      solarIrradianceKwhM2Year: solar.irradiance,
      solarIrradianceFallback: solar.fallback,
      province: province ?? undefined,
    }

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('lookup error', err)
    return NextResponse.json({ error: 'Failed to look up address' }, { status: 500 })
  }
}
