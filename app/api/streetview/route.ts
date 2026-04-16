import { NextRequest, NextResponse } from 'next/server'

/**
 * Street View proxy — keeps the Google API key server-side.
 * Currently stubbed: returns a placeholder image URL until a key is configured.
 */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')

  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  // No key configured — return stub
  if (!apiKey) {
    return NextResponse.json({ url: null, stub: true })
  }

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  const imageUrl =
    `https://maps.googleapis.com/maps/api/streetview` +
    `?size=640x400&location=${lat},${lng}&fov=80&heading=70&pitch=0&key=${apiKey}`

  return NextResponse.json({ url: imageUrl })
}
