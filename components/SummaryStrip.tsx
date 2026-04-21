'use client'

import { useLocale } from '@/lib/locale-context'
import { fmt } from '@/lib/constants'
import { co2ToTrees } from '@/lib/co2'
import { buildEnergyModel, diffModels, getScenarioPrices } from '@/lib/recommendations'
import { getProvinceFromPostcode } from '@/lib/postcode-province'
import type { UpgradeResult, PriceScenario } from '@/types/upgrade'
import type { HomeProfile } from '@/types/home-profile'

interface Props {
  results: UpgradeResult[]
  profile: HomeProfile
  scenario?: PriceScenario
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

export default function SummaryStrip({ results, profile, scenario = 'current' }: Props) {
  const { t, locale } = useLocale()

  const prices = getScenarioPrices(scenario, profile)
  const province = getProvinceFromPostcode(profile.postcode ?? '1000')
  const allUpgrades = results.map(r => ({
    id: r.id,
    tierId: r.selectedTierId,
    params: r.tiers?.find(t => t.tierId === r.selectedTierId)?.params,
  })).filter(u => u.id)
  const currentModel = buildEnergyModel(profile, province, [], prices)
  const allModel = buildEnergyModel(profile, province, allUpgrades, prices)
  const allDiff = diffModels(currentModel, allModel)
  const maxAnnualSaving = Math.round(allDiff.annualSavingEuro)
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
      label: t('results.summary.twentyYear'),
      value: `€${fmt(twentyYearNet)}`,
      unit: t('results.summary.twentyYearUnit'),
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
