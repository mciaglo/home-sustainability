'use client'

import { useLocale } from '@/lib/locale-context'
import type { PriceScenario } from '@/types/upgrade'

interface Props {
  value: PriceScenario
  onChange: (s: PriceScenario) => void
}

export default function PriceScenarioToggle({ value, onChange }: Props) {
  const { t } = useLocale()

  const options: { id: PriceScenario; label: string }[] = [
    { id: 'current',     label: t('results.priceScenario.current') },
    { id: 'peak2022',    label: t('results.priceScenario.peak2022') },
    { id: 'conservative', label: t('results.priceScenario.conservative') },
  ]

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 w-fit">
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            value === o.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
