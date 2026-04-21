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

function formatPostcode(raw: string): string {
  const clean = raw.replace(/\s/g, '').toUpperCase()
  if (clean.length <= 4) return clean
  return clean.slice(0, 4) + ' ' + clean.slice(4, 6)
}

function isValidPostcode(pc: string): boolean {
  return /^\d{4}\s?[A-Za-z]{2}$/.test(pc.trim())
}

export default function AddressInput() {
  const { locale, t } = useLocale()
  const router = useRouter()
  const nl = locale === 'nl'

  const [postcode, setPostcode] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [resolved, setResolved] = useState<Suggestion | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const houseNumberRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setResolved(null)
    setNotFound(false)

    const pc = postcode.replace(/\s/g, '')
    const hn = houseNumber.trim()
    if (!isValidPostcode(pc) || !hn) return

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const query = `${pc} ${hn}`
        const res = await fetch(`/api/address-suggest?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        const suggestions: Suggestion[] = data.suggestions ?? []

        if (suggestions.length > 0) {
          setResolved(suggestions[0])
          setNotFound(false)
        } else {
          setResolved(null)
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [postcode, houseNumber])

  function handlePostcodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const formatted = formatPostcode(raw)
    if (formatted.replace(/\s/g, '').length <= 6) {
      setPostcode(formatted)
      if (formatted.replace(/\s/g, '').length === 6) {
        houseNumberRef.current?.focus()
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!resolved) return
    setSubmitting(true)

    const params = new URLSearchParams({ address: resolved.address })
    if (resolved.lat) params.set('lat', String(resolved.lat))
    if (resolved.lng) params.set('lng', String(resolved.lng))
    if (resolved.bagVerblijfsobjectId) params.set('bagVboId', resolved.bagVerblijfsobjectId)
    if (resolved.postcode) params.set('postcode', resolved.postcode)
    if (resolved.province) params.set('province', resolved.province)
    if (resolved.city) params.set('city', resolved.city)

    router.push(`/profile?${params.toString()}`)
  }

  function handleSkip() {
    router.push('/profile')
  }

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div className="flex gap-3">
          <div className="flex-[3]">
            <input
              type="text"
              value={postcode}
              onChange={handlePostcodeChange}
              placeholder={nl ? 'Postcode' : 'Postcode'}
              className="w-full px-5 py-4 text-lg rounded-2xl border border-stone-200 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent
                         placeholder:text-stone-400 text-stone-900 bg-white"
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className="flex-[2]">
            <input
              ref={houseNumberRef}
              type="text"
              value={houseNumber}
              onChange={e => setHouseNumber(e.target.value)}
              placeholder={nl ? 'Huisnr.' : 'House nr.'}
              className="w-full px-5 py-4 text-lg rounded-2xl border border-stone-200 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent
                         placeholder:text-stone-400 text-stone-900 bg-white"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Resolved address */}
        <div className="h-6 flex items-center px-1">
          {loading && (
            <span className="text-sm text-stone-400">
              {nl ? 'Zoeken...' : 'Searching...'}
            </span>
          )}
          {resolved && !loading && (
            <span className="text-sm text-emerald-700 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
              {resolved.label}
            </span>
          )}
          {notFound && !loading && (
            <span className="text-sm text-red-500">
              {nl ? 'Adres niet gevonden — controleer je postcode en huisnummer' : 'Address not found — check your postcode and house number'}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !resolved}
          className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200
                     text-white disabled:text-stone-400 font-semibold text-lg rounded-2xl
                     transition-colors shadow-sm"
        >
          {submitting ? '...' : t('landing.cta')}
        </button>
      </form>

      <button
        onClick={handleSkip}
        className="block mx-auto text-sm text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2"
      >
        {nl ? 'Ik wil alles zelf invullen →' : 'I\'d rather fill everything in myself →'}
      </button>
    </div>
  )
}
