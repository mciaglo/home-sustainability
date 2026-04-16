'use client'

import { useLocale } from '@/lib/locale-context'

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()

  return (
    <button
      onClick={() => setLocale(locale === 'nl' ? 'en' : 'nl')}
      className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors px-3 py-1 rounded-full border border-stone-200 hover:border-stone-400"
      aria-label="Switch language"
    >
      {t('general.languageToggle')}
    </button>
  )
}
