'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'
import LoadingSteps from '@/components/LoadingSteps'
import HomeProfileForm from '@/components/HomeProfile'
import LanguageToggle from '@/components/LanguageToggle'
import type { HomeProfile } from '@/types/home-profile'

function ProfileContent() {
  const { locale, t } = useLocale()
  const searchParams = useSearchParams()
  const address = searchParams.get('address') ?? ''
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const bagVboId = searchParams.get('bagVboId')
  const postcode = searchParams.get('postcode')
  const province = searchParams.get('province')
  const city = searchParams.get('city')

  const [profile, setProfile] = useState<Partial<HomeProfile> | null>(null)
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // If returning from results, restore saved profile from session
    try {
      const saved = sessionStorage.getItem('homeProfile')
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<HomeProfile>
        if (parsed.address && (!address || parsed.address.includes(address.split(',')[0]))) {
          setProfile(parsed)
          if (parsed.lat && parsed.lng) {
            fetch(`/api/streetview?lat=${parsed.lat}&lng=${parsed.lng}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => { if (d?.url) setStreetViewUrl(d.url) })
              .catch(() => {})
          }
          return
        }
      }
    } catch {}

    if (!address) {
      // Manual entry flow — show empty form with defaults
      setProfile({
        address: '',
        yearBuilt: 1980,
        floorArea: 100,
        buildingType: 'terraced',
        energyLabel: 'unknown',
        heatingType: 'gas-boiler',
        insulation: { wall: 'unknown', roof: 'unknown', floor: 'unknown', glazing: 'unknown' },
        estimatedGasM3PerYear: 1500,
        estimatedElectricityKwhPerYear: 3500,
        isMonument: false,
        isVvE: false,
        postcode: '',
      } as Partial<HomeProfile>)
      return
    }

    async function load() {
      try {
        const lookupParams = new URLSearchParams({ address })
        if (lat) lookupParams.set('lat', lat)
        if (lng) lookupParams.set('lng', lng)
        if (bagVboId) lookupParams.set('bagVboId', bagVboId)
        if (postcode) lookupParams.set('postcode', postcode)
        if (province) lookupParams.set('province', province)
        if (city) lookupParams.set('city', city)
        const res = await fetch(`/api/lookup?${lookupParams.toString()}`)
        if (!res.ok) throw new Error('lookup failed')
        const data = await res.json()
        const p: Partial<HomeProfile> = { ...data.profile, address }
        setProfile(p)

        // Fetch street view
        if (p.lat && p.lng) {
          const svRes = await fetch(`/api/streetview?lat=${p.lat}&lng=${p.lng}`)
          if (svRes.ok) {
            const svData = await svRes.json()
            if (svData.url) setStreetViewUrl(svData.url)
          }
        }
      } catch {
        setError(t('error.lookup'))
      }
    }

    load()
  }, [address, retryCount])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-gray-600">{error}</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => { setError(null); setProfile(null); setRetryCount(c => c + 1) }}
              className="text-emerald-600 hover:underline text-sm"
            >
              {t('error.retry')}
            </button>
            <a href="/profile" className="text-stone-500 hover:underline text-sm">
              {t('error.manualEntry')}
            </a>
            <a href="/" className="text-stone-400 hover:underline text-sm">
              ← {locale === 'nl' ? 'Terug' : 'Back'}
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <LoadingSteps />
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-4 py-4 max-w-4xl mx-auto">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← {address || (locale === 'nl' ? 'Terug' : 'Back')}
        </a>
        <LanguageToggle />
      </header>

      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-2">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
          <p className="text-gray-500 mt-1">{t('profile.subtitle')}</p>
        </div>

        <HomeProfileForm profile={profile} streetViewUrl={streetViewUrl} />
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSteps />}>
      <ProfileContent />
    </Suspense>
  )
}
