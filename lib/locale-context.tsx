'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Locale } from './i18n'
import { t as translate, defaultLocale } from './i18n'
import type { TranslationKey } from './i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
})

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale') as Locale | null
      if (stored === 'nl' || stored === 'en') setLocaleState(stored)
    } catch {}
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem('locale', l) } catch {}
  }, [])

  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(key, locale, vars)

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
