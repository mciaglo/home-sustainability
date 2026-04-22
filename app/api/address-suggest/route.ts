import { NextRequest, NextResponse } from 'next/server'

interface PdokDoc {
  weergavenaam: string
  centroide_ll: string
  postcode?: string
  straatnaam?: string
  huisnummer?: number
  woonplaatsnaam?: string
  adresseerbaarobject_id?: string
  nummeraanduiding_id?: string
  provincienaam?: string
}

function parseCentroide(wkt: string): { lat: number; lng: number } | null {
  const m = wkt?.match(/POINT\(([^\s]+)\s+([^\)]+)\)/)
  if (!m) return null
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json({ error: 'q parameter must be at least 2 characters' }, { status: 400 })

  try {
    const url = new URL('https://api.pdok.nl/bzk/locatieserver/search/v3_1/free')
    url.searchParams.set('q', q)
    url.searchParams.set('fq', 'type:adres')
    url.searchParams.set('rows', '6')
    url.searchParams.set('fl', 'weergavenaam,centroide_ll,postcode,straatnaam,huisnummer,woonplaatsnaam,adresseerbaarobject_id,nummeraanduiding_id,provincienaam')

    const res = await fetch(url.toString(), { next: { revalidate: 0 } })
    if (!res.ok) return NextResponse.json({ error: 'Address lookup service unavailable' }, { status: 502 })

    const data = await res.json()
    const docs: PdokDoc[] = data?.response?.docs ?? []

    const suggestions = docs
      .map(doc => {
        const coords = parseCentroide(doc.centroide_ll)
        if (!coords) return null
        return {
          label: doc.weergavenaam,
          address: doc.weergavenaam,
          lat: coords.lat,
          lng: coords.lng,
          bagVerblijfsobjectId: doc.adresseerbaarobject_id ?? null,
          nummeraanduidingId: doc.nummeraanduiding_id ?? null,
          postcode: doc.postcode ?? null,
          province: doc.provincienaam ?? null,
          city: doc.woonplaatsnaam ?? null,
          street: doc.straatnaam ?? null,
          houseNumber: doc.huisnummer != null ? String(doc.huisnummer) : null,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('PDOK suggest error', err)
    return NextResponse.json({ error: 'Address lookup failed' }, { status: 500 })
  }
}
