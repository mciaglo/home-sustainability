'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'
import LoadingSteps from '@/components/LoadingSteps'
import HomeProfileForm from '@/components/HomeProfile'
import LanguageToggle from '@/components/LanguageToggle'
import type { HomeProfile } from '@/types/home-profile'

function ProfileContent() {
  const { t } = useLocale()
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

  useEffect(() => {
    if (!address) return

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
        setError('Er is iets misgegaan. Probeer het opnieuw.')
      }
    }

    load()
  }, [address])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-gray-600">{error}</p>
          <a href="/" className="text-green-600 hover:underline text-sm">← Terug</a>
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
          ← {t('general.from')} {address}
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
