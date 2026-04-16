'use client'

import { useLocale } from '@/lib/locale-context'

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()

  return (
    <button
      onClick={() => setLocale(locale === 'nl' ? 'en' : 'nl')}
      className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1 rounded-full border border-gray-200 hover:border-gray-400"
      aria-label="Switch language"
    >
      {t('general.languageToggle')}
    </button>
  )
}
