'use client'

import { useLocale } from '@/lib/locale-context'
import type { PriceScenario } from '@/types/upgrade'

interface Props {
  value: PriceScenario
  onChange: (s: PriceScenario) => void
  hasContract?: boolean
}

export default function PriceScenarioToggle({ value, onChange, hasContract }: Props) {
  const { t } = useLocale()

  const options: { id: PriceScenario; label: string }[] = [
    { id: 'current',      label: t('results.priceScenario.current') },
    ...(hasContract ? [{ id: 'contract' as PriceScenario, label: t('results.priceScenario.contract') }] : []),
    { id: 'peak2022',     label: t('results.priceScenario.peak2022') },
    { id: 'conservative', label: t('results.priceScenario.conservative') },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-stone-500 mr-1">{t('results.priceScenarioLabel')}:</span>
      <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1">
        {options.map(o => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              value === o.id
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
