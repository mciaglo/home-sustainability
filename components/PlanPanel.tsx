'use client'

import { useLocale } from '@/lib/locale-context'
import { LABEL_ORDER, LABEL_COLOURS, EPC_DELTA, fmt } from '@/lib/constants'
import { buildEnergyModel, diffModels, getScenarioPrices } from '@/lib/recommendations'
import { computeSynergySavings } from '@/lib/combinations'
import { getProvinceFromPostcode } from '@/lib/postcode-province'
import type { EnergyLabel, HomeProfile } from '@/types/home-profile'
import type { UpgradeResult, PriceScenario } from '@/types/upgrade'

function getEpcDelta(result: UpgradeResult, tierId: string): number {
  if (result.tiers) {
    const tier = result.tiers.find(t => t.tierId === tierId)
    if (tier) return tier.epcDelta
  }
  return EPC_DELTA[result.id] ?? 0
}

function getTierLabel(result: UpgradeResult, tierId: string, locale: string): string | null {
  if (!result.tiers) return null
  const tier = result.tiers.find(t => t.tierId === tierId)
  if (!tier) return null
  return locale === 'nl' ? tier.labelNl : tier.labelEn
}

interface Props {
  currentLabel: EnergyLabel
  selections: Map<string, string>
  results: UpgradeResult[]
  upgradeNames: Record<string, { nl: string; en: string }>
  onRemove: (id: string) => void
  profile: HomeProfile
  scenario?: PriceScenario
}

export default function PlanPanel({ currentLabel, selections, results, upgradeNames, onRemove, profile, scenario = 'current' }: Props) {
  const { locale } = useLocale()

  const selected = results.filter(r => selections.has(r.id))
  const hasSelection = selected.length > 0

  const knownLabel = currentLabel !== 'unknown'
  const currentIdx = knownLabel ? LABEL_ORDER.indexOf(currentLabel) : 0
  const totalDelta = selected.reduce((sum, r) => {
    const tierId = selections.get(r.id) ?? ''
    return sum + getEpcDelta(r, tierId)
  }, 0)
  const potentialIdx = Math.min(currentIdx + totalDelta, LABEL_ORDER.length - 1)
  const potentialLabel = LABEL_ORDER[potentialIdx] as EnergyLabel
  const showTransition = knownLabel && hasSelection && potentialIdx > currentIdx

  const prices = getScenarioPrices(scenario, profile)
  const province = getProvinceFromPostcode(profile.postcode ?? '1000')
  const appliedUpgrades = selected.map(r => {
    const tierId = selections.get(r.id) ?? r.selectedTierId ?? ''
    const tier = r.tiers?.find(t => t.tierId === tierId)
    return { id: r.id, tierId, params: tier?.params }
  })
  const currentModel = buildEnergyModel(profile, province, [], prices)
  const planModel = buildEnergyModel(profile, province, appliedUpgrades, prices)
  const planDiff = diffModels(currentModel, planModel)
  const totalSaving = Math.round(planDiff.annualSavingEuro)

  const avgCosts = new Map<string, number>()
  const totalNetCostRaw = selected.reduce((s, r) => {
    const tierId = selections.get(r.id) ?? ''
    let avg: number
    if (r.tiers) {
      const tier = r.tiers.find(t => t.tierId === tierId)
      avg = tier ? Math.round((tier.netCostMin + tier.netCostMax) / 2) : Math.round((r.netCostMin + r.netCostMax) / 2)
    } else {
      avg = Math.round((r.netCostMin + r.netCostMax) / 2)
    }
    avgCosts.set(r.id, avg)
    return s + avg
  }, 0)
  const synergySavings = computeSynergySavings(new Set(selected.map(r => r.id)), avgCosts)
  const totalNetCost = Math.max(0, totalNetCostRaw - synergySavings)

  const twentyYearNet = Math.max(0, totalSaving * 20 - totalNetCost)

  const individualSavingsSum = selected.reduce((s, r) => {
    const tierId = selections.get(r.id) ?? ''
    if (r.tiers) {
      const tier = r.tiers.find(t => t.tierId === tierId)
      if (tier) return s + tier.annualSaving
    }
    return s + r.annualSaving
  }, 0)
  const combinedDiffers = selected.length >= 2 && Math.abs(totalSaving - individualSavingsSum) > individualSavingsSum * 0.05

  const combinedPayback = totalSaving > 0 ? Math.round((totalNetCost / totalSaving) * 10) / 10 : 0

  return (
    <>
      {/* Desktop panel */}
      <div>
        <div className="sticky top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-sm font-semibold text-stone-800">
                {locale === 'nl' ? 'Jouw plan' : 'Your plan'}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {hasSelection
                  ? `${selected.length} ${locale === 'nl' ? 'maatregelen geselecteerd' : 'upgrades selected'}`
                  : (locale === 'nl' ? 'Nog geen maatregelen geselecteerd' : 'No upgrades selected yet')}
              </p>
            </div>

            {/* Energy label */}
            <div>
              <p className="text-xs text-stone-500 mb-2">
                {locale === 'nl' ? 'Energielabel' : 'Energy label'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap ${LABEL_COLOURS[currentLabel]}`}>
                  {currentLabel === 'unknown' ? '?' : currentLabel}
                </span>
                {showTransition && (
                  <>
                    <span className="text-stone-300 text-sm">→</span>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap ${LABEL_COLOURS[potentialLabel]} transition-all duration-300`}>
                      {potentialLabel}
                    </span>
                  </>
                )}
              </div>
            </div>

            {hasSelection ? (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-stone-500 mb-0.5">
                      {locale === 'nl' ? 'Jaarlijkse besparing' : 'Annual savings'}
                    </p>
                    <p className="text-xl font-bold text-emerald-700">€{fmt(totalSaving)}<span className="text-xs font-normal text-stone-400 ml-1">{locale === 'nl' ? '/jaar' : '/yr'}</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 mb-0.5">
                      {locale === 'nl' ? '20-jaar netto besparing' : '20-year net savings'}
                    </p>
                    <p className="text-lg font-bold text-emerald-700">€{fmt(twentyYearNet)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 mb-0.5">
                      {locale === 'nl' ? 'Totale investering' : 'Total investment'}
                    </p>
                    <p className="text-lg font-bold text-stone-900">€{fmt(totalNetCost)}<span className="text-xs font-normal text-stone-400 ml-1">{locale === 'nl' ? 'na subsidie' : 'after subsidy'}</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 mb-0.5">
                      {locale === 'nl' ? 'Gecombineerde terugverdientijd' : 'Combined payback'}
                    </p>
                    <p className="text-lg font-bold text-stone-900">{combinedPayback} {locale === 'nl' ? 'jaar' : 'years'}</p>
                  </div>
                  {combinedDiffers && (
                    <p className="text-xs text-stone-400 italic">
                      {locale === 'nl'
                        ? 'Gecombineerde besparing houdt rekening met wisselwerking tussen maatregelen'
                        : 'Combined savings account for interactions between upgrades'}
                    </p>
                  )}
                </div>

                <hr className="border-stone-100" />

                <div>
                  <ul className="space-y-1.5">
                    {selected.map(r => {
                      const tierId = selections.get(r.id) ?? ''
                      const tierLabel = getTierLabel(r, tierId, locale)
                      return (
                        <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-stone-700 truncate">
                            {locale === 'nl' ? (upgradeNames[r.id]?.nl ?? r.id) : (upgradeNames[r.id]?.en ?? r.id)}
                            {tierLabel && <span className="text-stone-400 ml-1">· {tierLabel}</span>}
                          </span>
                          <button
                            onClick={() => onRemove(r.id)}
                            className="text-stone-300 hover:text-stone-500 flex-shrink-0 text-xs"
                            title={locale === 'nl' ? 'Verwijderen' : 'Remove'}
                          >
                            ✕
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {knownLabel && potentialLabel !== 'A+++' && (
                  <p className="text-xs text-emerald-600 text-center">
                    {locale === 'nl'
                      ? 'Voeg meer maatregelen toe om A+++ te bereiken'
                      : 'Add more upgrades to reach A+++'}
                  </p>
                )}

                <a
                  href="/quote"
                  onClick={() => {
                    const obj: Record<string, string> = {}
                    selections.forEach((v, k) => { obj[k] = v })
                    sessionStorage.setItem('quoteSelections', JSON.stringify({ selections: obj }))
                  }}
                  className="block w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm text-center rounded-xl transition-colors"
                >
                  {locale === 'nl' ? 'Ontvang gratis offertes' : 'Get free quotes'}
                </a>
                <p className="text-xs text-stone-400 text-center -mt-2">
                  {locale === 'nl'
                    ? 'Gratis · Vrijblijvend · Max. 3 installateurs'
                    : 'Free · No obligation · Up to 3 installers'}
                </p>
              </>
            ) : (
              <p className="text-sm text-stone-400 italic">
                {locale === 'nl'
                  ? 'Selecteer maatregelen om je plan te zien'
                  : 'Select upgrades to see your plan'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 z-20">
        <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
          {hasSelection ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-stone-500">
                  {locale === 'nl' ? 'Jouw plan' : 'Your plan'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${LABEL_COLOURS[currentLabel]}`}>
                  {currentLabel === 'unknown' ? '?' : currentLabel}
                </span>
                {showTransition && (
                  <>
                    <span className="text-stone-300 text-xs">→</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${LABEL_COLOURS[potentialLabel]}`}>
                      {potentialLabel}
                    </span>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-700">€{fmt(totalSaving)}<span className="text-xs font-normal text-stone-400">{locale === 'nl' ? '/jaar' : '/yr'}</span></p>
                <p className="text-xs text-stone-400">{selected.length} {locale === 'nl' ? 'geselecteerd' : 'selected'}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-stone-400 w-full text-center">
              {locale === 'nl'
                ? 'Selecteer maatregelen om je plan te maken'
                : 'Select upgrades to build your plan'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
