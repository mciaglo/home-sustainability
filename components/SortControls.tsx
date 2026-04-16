'use client'

import { useLocale } from '@/lib/locale-context'

export type SortMode = 'savings' | 'roi' | 'co2' | 'independence'

interface Props {
  value: SortMode
  onChange: (mode: SortMode) => void
}

export default function SortControls({ value, onChange }: Props) {
  const { t } = useLocale()

  const options: { id: SortMode; label: string }[] = [
    { id: 'savings',      label: t('results.sortSavings') },
    { id: 'roi',          label: t('results.sortRoi') },
    { id: 'co2',          label: t('results.sortCo2') },
    { id: 'independence', label: t('results.sortIndependence') },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-stone-500 mr-1">{t('results.sortBy')}:</span>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === o.id
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
