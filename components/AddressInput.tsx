'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'

interface PdokDoc {
  weergavenaam: string
  type: string
  centroide_ll: string // "POINT(lon lat)"
  postcode?: string
  straatnaam?: string
  huisnummer?: string
  woonplaatsnaam?: string
}

interface Suggestion {
  label: string       // display string
  address: string     // what gets passed to /api/lookup
  lat: number
  lng: number
}

function parseCentroide(wkt: string): { lat: number; lng: number } | null {
  // WKT format: "POINT(4.88969 52.37316)" — lon first, lat second
  const m = wkt.match(/POINT\(([^\s]+)\s+([^\)]+)\)/)
  if (!m) return null
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) }
}

async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  if (query.length < 3) return []

  try {
    const url = new URL('https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest')
    url.searchParams.set('q', query)
    url.searchParams.set('fq', 'type:adres')
    url.searchParams.set('rows', '6')

    const res = await fetch(url.toString())
    if (!res.ok) return []

    const data = await res.json()
    const docs: PdokDoc[] = data?.response?.docs ?? []

    return docs
      .map(doc => {
        const coords = parseCentroide(doc.centroide_ll ?? '')
        if (!coords) return null
        return {
          label: doc.weergavenaam,
          address: doc.weergavenaam,
          lat: coords.lat,
          lng: coords.lng,
        }
      })
      .filter((s): s is Suggestion => s !== null)
  } catch {
    return []
  }
}

export default function AddressInput() {
  const { t } = useLocale()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query || selected) { setSuggestions([]); return }

    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(query)
      setSuggestions(results)
    }, 250)
  }, [query, selected])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const address = selected?.address ?? query
    if (!address.trim()) return

    setLoading(true)
    const params = new URLSearchParams({ address })
    if (selected?.lat) params.set('lat', String(selected.lat))
    if (selected?.lng) params.set('lng', String(selected.lng))
    router.push(`/profile?${params.toString()}`)
  }

  function handleSelect(s: Suggestion) {
    setSelected(s)
    setQuery(s.label)
    setSuggestions([])
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          placeholder={t('landing.addressPlaceholder')}
          className="w-full px-5 py-4 text-lg rounded-2xl border border-gray-200 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                     placeholder:text-gray-400 text-gray-900"
          autoComplete="off"
          autoFocus
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-200
                   text-white disabled:text-gray-400 font-semibold text-lg rounded-2xl
                   transition-colors shadow-sm"
      >
        {loading ? '...' : t('landing.cta')}
      </button>
    </form>
  )
}
