'use client'

import { useLocale } from '@/lib/locale-context'
import type { UpgradeResult } from '@/types/upgrade'

interface Props {
  results: UpgradeResult[]
}

function fmt(n: number) {
  return n.toLocaleString('nl-NL')
}

// ~21 kg CO₂ absorbed per tree per year (EPA estimate)
function co2ToTrees(tonnesPerYear: number): number {
  return Math.round((tonnesPerYear * 1000) / 21)
}

function getEarliestDeadline(results: UpgradeResult[]): string | null {
  const deadlines = results
    .flatMap(r => r.subsidies)
    .filter(s => s.amount > 0 && s.deadline)
    .map(s => s.deadline!)

  if (deadlines.length === 0) return null
  return deadlines[0]
}

function shortenDeadline(deadline: string): string {
  const match = deadline.match(/^(\w+)/);
  return match ? match[1] : deadline
}

export default function SummaryStrip({ results }: Props) {
  const { t, locale } = useLocale()

  const maxAnnualSaving = results.reduce((s, r) => s + r.annualSaving, 0)
  const twentyYearNet = results.reduce((s, r) => {
    const avgNet = Math.round((r.netCostMin + r.netCostMax) / 2)
    return s + Math.max(0, r.annualSaving * 20 - avgNet)
  }, 0)
  const bestPayback = results.length
    ? Math.min(...results.filter(r => r.paybackYears < 99).map(r => r.paybackYears))
    : 0
  const totalCo2 = results.reduce((s, r) => s + r.co2SavedTonnesPerYear, 0)
  const treesEquivalent = co2ToTrees(totalCo2)
  const subsidyCount = results.filter(r => r.subsidies.some(s => s.amount > 0)).length
  const earliestDeadline = getEarliestDeadline(results)

  const items: { label: string; value: string; unit: string; colour: string; nudge?: string }[] = [
    {
      label: t('results.summary.maxSavings'),
      value: `€${fmt(maxAnnualSaving)}`,
      unit: t('results.card.perYear'),
      colour: 'text-emerald-700',
    },
    {
      label: locale === 'nl' ? '20-jaar besparing' : '20-year savings',
      value: `€${fmt(twentyYearNet)}`,
      unit: locale === 'nl' ? 'netto' : 'net',
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
      nudge: locale === 'nl'
        ? `= ${fmt(treesEquivalent)} bomen planten`
        : `= ${fmt(treesEquivalent)} trees planted`,
    },
    {
      label: t('results.summary.subsidies'),
      value: `${subsidyCount}`,
      unit: locale === 'nl' ? 'maatregelen' : 'measures',
      colour: 'text-purple-600',
      nudge: earliestDeadline
        ? (locale === 'nl' ? `Actie voor: ${shortenDeadline(earliestDeadline)}` : `Act before: ${shortenDeadline(earliestDeadline)}`)
        : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map(item => (
        <div key={item.label} className="bg-white rounded-xl border border-stone-200 px-4 py-3">
          <p className="text-xs text-stone-500 mb-1">{item.label}</p>
          <p className={`text-xl font-bold ${item.colour}`}>
            {item.value}
            <span className="text-xs font-normal text-stone-400 ml-1">{item.unit}</span>
          </p>
          {item.nudge && (
            <p className="text-xs text-stone-400 mt-1">{item.nudge}</p>
          )}
        </div>
      ))}
    </div>
  )
}
