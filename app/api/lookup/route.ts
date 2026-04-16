import { NextRequest, NextResponse } from 'next/server'
import { nlAdapter } from '@/lib/adapters/nl'
import type { HomeProfile } from '@/types/home-profile'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 })
  }

  try {
    // 1. Fetch building data (BAG)
    const buildingData = await nlAdapter.fetchBuildingData(address)

    // 2. Fetch energy label (EP-online)
    const { label, registered } = await nlAdapter.fetchEnergyLabel(buildingData.bagId ?? '')

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
      postcodeAverageLabel: neighbourLabel ?? undefined,
      hasGridCongestion,
    }

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('lookup error', err)
    return NextResponse.json({ error: 'Failed to look up address' }, { status: 500 })
  }
}
