'use client'

import { useLocale } from '@/lib/locale-context'
import type { UpgradeResult } from '@/types/upgrade'

interface Props {
  results: UpgradeResult[]
}

function fmt(n: number) {
  return n.toLocaleString('nl-NL')
}

export default function SummaryStrip({ results }: Props) {
  const { t, locale } = useLocale()

  const maxAnnualSaving = results.reduce((s, r) => s + r.annualSaving, 0)
  const bestPayback = results.length
    ? Math.min(...results.filter(r => r.paybackYears < 99).map(r => r.paybackYears))
    : 0
  const totalCo2 = results.reduce((s, r) => s + r.co2SavedTonnesPerYear, 0)
  const subsidyCount = results.filter(r => r.subsidies.length > 0).length

  const items = [
    {
      label: t('results.summary.maxSavings'),
      value: `€${fmt(maxAnnualSaving)}`,
      unit: t('results.card.perYear'),
      colour: 'text-emerald-700',
    },
    {
      label: t('results.summary.bestPayback'),
      value: bestPayback > 0 ? `${bestPayback}` : '—',
      unit: bestPayback > 0 ? t('general.years') : '',
      colour: 'text-blue-600',
    },
    {
      label: t('results.summary.co2'),
      value: totalCo2.toFixed(1),
      unit: locale === 'nl' ? 't CO₂/jaar' : 't CO₂/yr',
      colour: 'text-emerald-600',
    },
    {
      label: t('results.summary.subsidies'),
      value: `${subsidyCount}`,
      unit: locale === 'nl' ? 'maatregelen' : 'measures',
      colour: 'text-purple-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.label} className="bg-white rounded-xl border border-stone-200 px-4 py-3">
          <p className="text-xs text-stone-500 mb-1">{item.label}</p>
          <p className={`text-xl font-bold ${item.colour}`}>
            {item.value}
            <span className="text-xs font-normal text-stone-400 ml-1">{item.unit}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
