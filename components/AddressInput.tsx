'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'

interface PostcodeSuggestion {
  postcode: string
  street: string
  city: string
  label: string
}

async function fetchPostcodeSuggestions(query: string): Promise<PostcodeSuggestion[]> {
  if (query.length < 4) return []

  // postcode.tech free API — no key required
  const postcodeMatch = query.match(/^(\d{4})\s?([A-Z]{0,2})$/i)
  if (!postcodeMatch) return []

  const postcode = postcodeMatch[1] + (postcodeMatch[2] ?? '').toUpperCase()
  try {
    const res = await fetch(`https://postcode.tech/api/v1/postcode/full?postcode=${postcode}`, {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTCODE_TECH_KEY ?? ''}` }
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!data) return []
    return [{
      postcode: data.postcode,
      street: data.street,
      city: data.city,
      label: `${data.street}, ${data.city} (${data.postcode})`,
    }]
  } catch {
    return []
  }
}

export default function AddressInput() {
  const { t } = useLocale()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PostcodeSuggestion[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query || selected) return

    debounceRef.current = setTimeout(async () => {
      const results = await fetchPostcodeSuggestions(query)
      setSuggestions(results)
    }, 300)
  }, [query, selected])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const address = selected ?? query
    if (!address.trim()) return

    setLoading(true)
    // Navigate to profile page with address in query string
    router.push(`/profile?address=${encodeURIComponent(address)}`)
  }

  function handleSelect(s: PostcodeSuggestion) {
    setSelected(`${s.postcode} ${s.street}`)
    setQuery(`${s.street}, ${s.city} (${s.postcode})`)
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
