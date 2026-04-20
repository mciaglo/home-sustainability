import { NextRequest, NextResponse } from 'next/server'
import { nlAdapter } from '@/lib/adapters/nl'
import type { HomeProfile } from '@/types/home-profile'

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

    // 4. Fetch neighbour average label (CBS)
    const neighbourLabel = await nlAdapter.fetchNeighbourLabel(buildingData.postcode)

    // 5. Check grid congestion
    const hasGridCongestion = await nlAdapter.fetchGridCongestion(buildingData.postcode)

    const profile: Partial<HomeProfile> = {
      ...baseProfile,
      address,
      energyLabelRegistered: registered,
      dataSource: registered ? 'ep-online' : 'build-era-lookup',
      postcodeAverageLabel: neighbourLabel ?? undefined,
      hasGridCongestion,
      province: province ?? undefined,
    }

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('lookup error', err)
    return NextResponse.json({ error: 'Failed to look up address' }, { status: 500 })
  }
}
