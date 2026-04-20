'use client'

import { useLocale } from '@/lib/locale-context'
import type { EnergyLabel } from '@/types/home-profile'
import type { UpgradeResult } from '@/types/upgrade'

const LABEL_ORDER: EnergyLabel[] = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'A+', 'A++', 'A+++']

const LABEL_COLOUR: Record<EnergyLabel, string> = {
  'A+++': 'bg-green-700 text-white',
  'A++': 'bg-emerald-700 text-white',
  'A+': 'bg-emerald-600 text-white',
  'A': 'bg-emerald-500 text-white',
  'B': 'bg-lime-400 text-white',
  'C': 'bg-yellow-400 text-stone-900',
  'D': 'bg-amber-400 text-stone-900',
  'E': 'bg-orange-400 text-white',
  'F': 'bg-orange-500 text-white',
  'G': 'bg-red-500 text-white',
  'unknown': 'bg-gray-300 text-stone-700',
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('nl-NL')
}

function getEpcDelta(result: UpgradeResult, tierId: string): number {
  if (result.tiers) {
    const tier = result.tiers.find(t => t.tierId === tierId)
    if (tier) return tier.epcDelta
  }
  const DEFAULT_EPC: Record<string, number> = {
    'cavity-wall-insulation': 1, 'external-wall-insulation': 2,
    'roof-insulation': 1, 'floor-insulation': 1,
    'glazing': 1, 'solar-panels': 1,
    'heat-pump': 2, 'hot-water-heat-pump': 1,
    'draught-proofing': 0, 'smart-thermostat': 0,
    'mechanical-ventilation': 0, 'home-battery': 0,
  }
  return DEFAULT_EPC[result.id] ?? 0
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
}

export default function PlanPanel({ currentLabel, selections, results, upgradeNames, onRemove }: Props) {
  const { locale } = useLocale()

  const selected = results.filter(r => selections.has(r.id))
  const hasSelection = selected.length > 0

  const currentIdx = LABEL_ORDER.indexOf(currentLabel)
  const totalDelta = selected.reduce((sum, r) => {
    const tierId = selections.get(r.id) ?? ''
    return sum + getEpcDelta(r, tierId)
  }, 0)
  const potentialIdx = Math.min(currentIdx + totalDelta, LABEL_ORDER.length - 1)
  const potentialLabel = LABEL_ORDER[potentialIdx] as EnergyLabel

  const totalSaving = selected.reduce((s, r) => {
    const tierId = selections.get(r.id) ?? ''
    if (r.tiers) {
      const tier = r.tiers.find(t => t.tierId === tierId)
      return s + (tier?.annualSaving ?? r.annualSaving)
    }
    return s + r.annualSaving
  }, 0)

  const totalNetCost = selected.reduce((s, r) => {
    const tierId = selections.get(r.id) ?? ''
    if (r.tiers) {
      const tier = r.tiers.find(t => t.tierId === tierId)
      if (tier) return s + Math.round((tier.netCostMin + tier.netCostMax) / 2)
    }
    return s + Math.round((r.netCostMin + r.netCostMax) / 2)
  }, 0)

  const twentyYearNet = selected.reduce((s, r) => {
    const tierId = selections.get(r.id) ?? ''
    let annSaving = r.annualSaving
    let avgNet = Math.round((r.netCostMin + r.netCostMax) / 2)
    if (r.tiers) {
      const tier = r.tiers.find(t => t.tierId === tierId)
      if (tier) {
        annSaving = tier.annualSaving
        avgNet = Math.round((tier.netCostMin + tier.netCostMax) / 2)
      }
    }
    return s + Math.max(0, annSaving * 20 - avgNet)
  }, 0)

  const combinedPayback = totalSaving > 0 ? Math.round((totalNetCost / totalSaving) * 10) / 10 : 0

  return (
    <>
      {/* Desktop panel */}
      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-5">
            {/* Label transition */}
            <div>
              <p className="text-xs text-stone-500 mb-2">
                {locale === 'nl' ? 'Energielabel' : 'Energy label'}
              </p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${LABEL_COLOUR[currentLabel]}`}>
                  {currentLabel}
                </span>
                {hasSelection && potentialIdx > currentIdx && (
                  <>
                    <span className="text-stone-300">→</span>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${LABEL_COLOUR[potentialLabel]} transition-all duration-300`}>
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
                </div>

                <hr className="border-stone-100" />

                <div>
                  <p className="text-xs text-stone-500 mb-2">
                    {selected.length} {locale === 'nl' ? 'maatregelen geselecteerd' : 'upgrades selected'}
                  </p>
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

                {potentialLabel !== 'A+++' && (
                  <p className="text-xs text-emerald-600 text-center">
                    {locale === 'nl'
                      ? `Voeg meer maatregelen toe om A+++ te bereiken`
                      : `Add more upgrades to reach A+++`}
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
                    ? 'Gratis · Vrijblijvend · Max. 3 bedrijven'
                    : 'Free · No obligation · Max. 3 companies'}
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
      {hasSelection && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 z-20">
          <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${LABEL_COLOUR[currentLabel]}`}>
                {currentLabel}
              </span>
              <span className="text-stone-300 text-xs">→</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${LABEL_COLOUR[potentialLabel]}`}>
                {potentialLabel}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-700">€{fmt(totalSaving)}<span className="text-xs font-normal text-stone-400">{locale === 'nl' ? '/jaar' : '/yr'}</span></p>
              <p className="text-xs text-stone-400">{selected.length} {locale === 'nl' ? 'geselecteerd' : 'selected'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
