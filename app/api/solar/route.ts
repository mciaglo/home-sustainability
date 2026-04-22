import { NextRequest, NextResponse } from 'next/server'

interface PVGISResponse {
  outputs: {
    totals: {
      fixed: {
        'E_y': number // Annual energy production kWh/kWp
      }
    }
  }
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  const tilt = req.nextUrl.searchParams.get('tilt') ?? '35'
  const aspect = req.nextUrl.searchParams.get('aspect') ?? '0' // 0 = south

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  try {
    const url = new URL('https://re.jrc.ec.europa.eu/api/v5_2/PVcalc')
    url.searchParams.set('lat', lat)
    url.searchParams.set('lon', lng)
    url.searchParams.set('peakpower', '1')
    url.searchParams.set('loss', '14')
    url.searchParams.set('mountingplace', 'building')
    url.searchParams.set('angle', tilt)
    url.searchParams.set('aspect', aspect)
    url.searchParams.set('outputformat', 'json')

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
    if (!res.ok) throw new Error(`PVGIS returned ${res.status}`)

    const data = (await res.json()) as PVGISResponse
    const irradianceKwhM2Year = data.outputs.totals.fixed['E_y']

    return NextResponse.json({ irradianceKwhM2Year, fallback: false })
  } catch (err) {
    console.error('PVGIS error', err)
    return NextResponse.json({ irradianceKwhM2Year: 950, fallback: true })
  }
}
