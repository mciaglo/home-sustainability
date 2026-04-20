'use client'

import AddressInput from '@/components/AddressInput'
import LanguageToggle from '@/components/LanguageToggle'
import { useLocale } from '@/lib/locale-context'

export default function LandingPage() {
  const { t } = useLocale()

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <header className="max-w-4xl w-full mx-auto flex justify-end px-4 py-4">
        <LanguageToggle />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        <div className="w-full max-w-xl text-center space-y-6">
          <h1 className="text-4xl font-bold text-stone-900 leading-tight">
            {t('landing.title')}
          </h1>

          <p className="text-lg text-stone-500 max-w-md mx-auto leading-relaxed">
            {t('landing.subtitle')}
          </p>

          <AddressInput />

          <p className="text-xs text-stone-400 pt-2">
            {t('landing.privacy')}
          </p>
        </div>
      </div>
    </main>
  )
}
