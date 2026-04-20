'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'

interface Suggestion {
  label: string
  address: string
  lat: number
  lng: number
  bagVerblijfsobjectId: string | null
  nummeraanduidingId: string | null
  postcode: string | null
  province: string | null
  city: string | null
  street: string | null
  houseNumber: string | null
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
      try {
        const res = await fetch(`/api/address-suggest?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.suggestions ?? [])
      } catch {
        setSuggestions([])
      }
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
    if (selected?.bagVerblijfsobjectId) params.set('bagVboId', selected.bagVerblijfsobjectId)
    if (selected?.postcode) params.set('postcode', selected.postcode)
    if (selected?.province) params.set('province', selected.province)
    if (selected?.city) params.set('city', selected.city)
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
          className="w-full px-5 py-4 text-lg rounded-2xl border border-stone-200 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent
                     placeholder:text-stone-400 text-stone-900 bg-white"
          autoComplete="off"
          autoFocus
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-5 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
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
        className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200
                   text-white disabled:text-stone-400 font-semibold text-lg rounded-2xl
                   transition-colors shadow-sm"
      >
        {loading ? '...' : t('landing.cta')}
      </button>
    </form>
  )
}
