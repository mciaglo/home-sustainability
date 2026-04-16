'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/locale-context'
import type { TranslationKey } from '@/lib/i18n'

const STEPS: TranslationKey[] = [
  'landing.loading.bag',
  'landing.loading.energy',
  'landing.loading.solar',
  'landing.loading.neighbourhood',
]

export default function LoadingSteps() {
  const { t } = useLocale()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(s => Math.min(s + 1, STEPS.length - 1))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
          <span className="text-gray-500 text-sm font-medium">Analyseren...</span>
        </div>

        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-3 transition-all duration-500 ${
              i <= activeStep ? 'opacity-100' : 'opacity-20'
            }`}
          >
            <div className={`w-4 h-4 rounded-full flex-shrink-0 transition-colors duration-300 ${
              i < activeStep
                ? 'bg-green-500'
                : i === activeStep
                ? 'bg-green-400 animate-pulse'
                : 'bg-gray-200'
            }`} />
            <span className={`text-sm ${i <= activeStep ? 'text-gray-700' : 'text-gray-300'}`}>
              {t(step)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
