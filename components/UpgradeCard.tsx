'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/lib/locale-context'
import type { UpgradeResult, UpgradeTag } from '@/types/upgrade'

const CURRENT_YEAR = new Date().getFullYear()

function translateInstallDays(text: string, locale: string): string {
  if (locale === 'nl') return text
  return text.replace(/dagen/g, 'days').replace(/dag/g, 'day').replace(/uur/g, 'hours')
}

const TAG_STYLE: Record<UpgradeTag, { bg: string; text: string; label: { nl: string; en: string } }> = {
  'top-pick':      { bg: 'bg-emerald-100 border border-emerald-300', text: 'text-emerald-800',  label: { nl: 'Topaanbeveling', en: 'Top pick' } },
  'quick-win':     { bg: 'bg-sky-100 border border-sky-300',         text: 'text-sky-800',      label: { nl: 'Snel rendement', en: 'Quick win' } },
  'strong':        { bg: 'bg-emerald-100 border border-emerald-300', text: 'text-emerald-800',  label: { nl: 'Goed rendement', en: 'Strong' } },
  'high-impact':   { bg: 'bg-indigo-100 border border-indigo-300',   text: 'text-indigo-800',   label: { nl: 'Grote impact',   en: 'High impact' } },
  'long-game':     { bg: 'bg-amber-100 border border-amber-300',     text: 'text-amber-800',    label: { nl: 'Lange termijn',  en: 'Long game' } },
  'comfort-boost': { bg: 'bg-purple-100 border border-purple-300',   text: 'text-purple-800',   label: { nl: 'Meer comfort',   en: 'Comfort boost' } },
}

function TagBadge({ tag, locale }: { tag: UpgradeTag; locale: string }) {
  const s = TAG_STYLE[tag]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {locale === 'nl' ? s.label.nl : s.label.en}
    </span>
  )
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('nl-NL')
}

interface Props {
  result: UpgradeResult
  selected: boolean
  selectedTierId?: string
  onToggleSelect: (tierId?: string) => void
  onChangeTier?: (tierId: string) => void
  upgradeNames: Record<string, { nl: string; en: string }>
}

export default function UpgradeCard({ result, selected, selectedTierId, onToggleSelect, onChangeTier, upgradeNames }: Props) {
  const { locale } = useLocale()
  const [expanded, setExpanded] = useState(false)
  const [viewedTierId, setViewedTierId] = useState(selectedTierId || result.selectedTierId)

  useEffect(() => {
    if (selectedTierId) setViewedTierId(selectedTierId)
  }, [selectedTierId])

  const name = locale === 'nl' ? (upgradeNames[result.id]?.nl ?? result.id) : (upgradeNames[result.id]?.en ?? result.id)

  const activeTier = result.tiers?.find(t => t.tierId === viewedTierId) ?? result.tiers?.[0] ?? null

  const monthlySaving = activeTier?.monthlySaving ?? result.monthlySaving
  const annualSaving = activeTier?.annualSaving ?? result.annualSaving
  const paybackYears = activeTier?.paybackYears ?? result.paybackYears
  const costMin = activeTier?.costMin ?? result.costMin
  const costMax = activeTier?.costMax ?? result.costMax
  const netCostMin = activeTier?.netCostMin ?? result.netCostMin
  const netCostMax = activeTier?.netCostMax ?? result.netCostMax
  const subsidies = activeTier?.subsidies ?? result.subsidies
  const totalReturn = activeTier?.totalReturn ?? result.totalReturn
  const freeSavingsYears = activeTier?.freeSavingsYears ?? result.freeSavingsYears
  const co2SavedTonnesPerYear = activeTier?.co2SavedTonnesPerYear ?? result.co2SavedTonnesPerYear
  const co2TreesEquivalent = activeTier?.co2TreesEquivalent ?? result.co2TreesEquivalent
  const gasReductionPercent = activeTier?.gasReductionPercent ?? result.gasReductionPercent
  const electricitySelfProducedPercent = activeTier?.electricitySelfProducedPercent ?? result.electricitySelfProducedPercent

  const recoupPct = Math.min(100, (paybackYears / result.lifespanYears) * 100)
  const freePct = Math.max(0, 100 - recoupPct)
  const paidOffYear = CURRENT_YEAR + Math.ceil(paybackYears)

  const isBlocked = result.blockedForVvE
  const isHeatPump = result.id === 'heat-pump'

  const totalSubsidyAmount = subsidies.reduce((sum, s) => sum + s.amount, 0)
  const hasSubsidy = totalSubsidyAmount > 0
  const avgGross = Math.round((costMin + costMax) / 2)
  const avgNet = Math.round((netCostMin + netCostMax) / 2)

  function handleTierClick(tierId: string) {
    setViewedTierId(tierId)
    onChangeTier?.(tierId)
  }

  function handleToggleSelect() {
    onToggleSelect(viewedTierId)
  }

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      isBlocked
        ? 'border-stone-200 bg-stone-50 opacity-60'
        : selected
        ? 'border-emerald-300 bg-white shadow-sm'
        : 'border-stone-200 bg-white hover:border-stone-300'
    }`}>
      {/* Collapsed header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={() => !isBlocked && setExpanded(e => !e)}
      >
        <button
          onClick={e => { e.stopPropagation(); if (!isBlocked) handleToggleSelect() }}
          className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all border-2 ${
            selected
              ? 'bg-emerald-700 border-emerald-700 text-white'
              : 'border-stone-300 text-transparent hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
          }`}
          title={locale === 'nl' ? 'Selecteren voor je plan' : 'Add to your plan'}
        >
          {selected ? '✓' : '+'}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-stone-900 ${isBlocked ? 'line-through' : ''}`}>
              {name}
            </span>
            <TagBadge tag={result.tag} locale={locale} />
          </div>
          <p className="text-sm text-stone-500 mt-0.5 truncate">
            {locale === 'nl' ? result.description : result.descriptionEn}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          {isBlocked ? (
            <span className="text-xs text-stone-400">
              {locale === 'nl' ? 'VvE vereist' : 'VvE required'}
            </span>
          ) : (
            <>
              <p className="text-lg font-bold text-emerald-700">
                €{fmt(monthlySaving)}<span className="text-xs font-normal text-stone-400">{locale === 'nl' ? '/mnd' : '/mo'}</span>
              </p>
              <p className="text-xs text-stone-400">
                {locale === 'nl' ? `${paybackYears} jr terugverdientijd` : `${paybackYears} yr payback`}
              </p>
            </>
          )}
        </div>

        {!isBlocked && (
          <span className={`text-stone-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        )}
      </div>

      {/* VvE blocked explanation */}
      {isBlocked && (
        <div className="px-5 pb-4">
          <p className="text-xs text-stone-500 bg-stone-100 rounded-lg px-3 py-2">
            {locale === 'nl'
              ? 'Deze maatregel vereist aanpassingen aan de buitenkant — overleg eerst met je VvE.'
              : 'This upgrade requires exterior changes — check with your VvE first.'}
          </p>
        </div>
      )}

      {/* Expanded body */}
      {expanded && !isBlocked && (
        <div className="border-t border-stone-100 px-5 pb-6 pt-5 space-y-5">

          {/* Tier selector */}
          {result.tiers && result.tiers.length > 1 && (() => {
            const tierInfo = locale === 'nl' ? result.tierInfoNl : result.tierInfoEn
            return (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 bg-stone-100 rounded-full p-1">
                  {result.tiers.map(tier => {
                    const isActive = tier.tierId === viewedTierId
                    return (
                      <button
                        key={tier.tierId}
                        onClick={() => handleTierClick(tier.tierId)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-white text-stone-900 shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        {locale === 'nl' ? tier.labelNl : tier.labelEn}
                      </button>
                    )
                  })}
                </div>
                {tierInfo && (
                  <div className="relative group">
                    <span className="w-5 h-5 flex items-center justify-center text-[11px] font-medium text-stone-400 hover:text-stone-600 border border-stone-300 rounded-full cursor-help">
                      i
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-stone-800 text-white text-xs rounded-lg w-64 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
                      {tierInfo}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800" />
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Financial grid */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-1">
                {locale === 'nl' ? 'Totale kosten' : 'Total cost'}
              </p>
              {hasSubsidy ? (
                <>
                  <p className="text-sm text-stone-400 line-through">€{fmt(avgGross)}</p>
                  <p className="text-xl font-bold text-stone-900">€{fmt(avgNet)}</p>
                  {subsidies.map((s, i) => (
                    <div key={i} className="mt-1">
                      <p className="text-xs text-amber-600 font-medium">
                        {s.name} — €{fmt(s.amount)}
                      </p>
                      {s.deadline && (
                        <p className="text-xs text-amber-500">
                          ⚠ {locale === 'nl' ? `Budget loopt op in ${s.deadline}` : `Budget exhausted by ${s.deadline}`}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-xl font-bold text-stone-900">
                  €{fmt(costMin)}–{fmt(costMax)}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-1">
                {locale === 'nl' ? 'Maandelijkse besparing' : 'Monthly saving'}
              </p>
              <p className="text-xl font-bold text-emerald-700">€{fmt(monthlySaving)}{locale === 'nl' ? '/mnd' : '/mo'}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                €{fmt(annualSaving)}/{locale === 'nl' ? 'jaar' : 'yr'}
              </p>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-1">
                {locale === 'nl' ? '20-jaar netto' : '20-year net'}
              </p>
              {(() => {
                const twentyYearNet = Math.max(0, annualSaving * 20 - avgNet)
                return (
                  <>
                    <p className={`text-xl font-bold ${twentyYearNet > 0 ? 'text-emerald-700' : 'text-stone-400'}`}>
                      €{fmt(twentyYearNet)}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {locale === 'nl' ? 'na aftrek investering' : 'after investment'}
                    </p>
                  </>
                )
              })()}
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* Timing section */}
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-stone-500 mb-1">
                  {locale === 'nl' ? 'Terugverdientijd' : 'Paid off in'}
                </p>
                <p className="text-xl font-bold text-stone-900">
                  {paybackYears} {locale === 'nl' ? 'jaar' : 'years'}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {locale === 'nl' ? `Terugverdiend in ${paidOffYear}` : `Costs recouped by ${paidOffYear}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">
                  {locale === 'nl' ? 'Gratis besparing' : 'Free savings'}
                </p>
                <p className="text-xl font-bold text-emerald-700">
                  {freeSavingsYears} {locale === 'nl' ? 'jaar' : 'years'}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {locale === 'nl' ? `Na terugverdientijd` : `After payback period`}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">
                  {locale === 'nl' ? 'Totaal rendement' : 'Total return'}
                </p>
                <p className="text-xl font-bold text-emerald-700">
                  €{fmt(totalReturn)}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {locale === 'nl' ? `t/m ${CURRENT_YEAR + result.lifespanYears}` : `by ${CURRENT_YEAR + result.lifespanYears}`}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex rounded-full overflow-hidden h-3">
                <div className="bg-red-400" style={{ width: `${recoupPct}%` }} />
                <div className="bg-emerald-500" style={{ width: `${freePct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-stone-400">
                <span>{locale === 'nl' ? 'Nu' : 'Now'}</span>
                <span>{paidOffYear}</span>
                <span>{CURRENT_YEAR + result.lifespanYears}</span>
              </div>
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* CO₂ & Energy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-1">{locale === 'nl' ? 'CO₂-reductie' : 'CO₂ reduction'}</p>
              <p className="text-base font-semibold text-stone-900">
                {co2SavedTonnesPerYear.toFixed(1)} t{locale === 'nl' ? '/jaar' : '/yr'}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                = {fmt(co2TreesEquivalent)} {locale === 'nl' ? 'bomen planten' : 'trees planted'}
              </p>
            </div>

            <div>
              <p className="text-xs text-stone-500 mb-1">
                {locale === 'nl' ? 'Energieonafhankelijkheid' : 'Energy independence'}
              </p>
              {gasReductionPercent > 0 && (
                <p className="text-base font-semibold text-stone-900">
                  {gasReductionPercent}% {locale === 'nl' ? 'minder gas' : 'less gas'}
                </p>
              )}
              {electricitySelfProducedPercent > 0 && (
                <p className="text-base font-semibold text-stone-900">
                  {electricitySelfProducedPercent}% {locale === 'nl' ? 'zelf opgewekt' : 'self-produced'}
                </p>
              )}
            </div>
          </div>

          {result.propertyValueUpliftMin && result.propertyValueUpliftMax && (
            <p className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
              {locale === 'nl'
                ? `Upgrade van label verbetert woningwaarde typisch met €${fmt(result.propertyValueUpliftMin)}–€${fmt(result.propertyValueUpliftMax)}.`
                : `Upgrading your label typically adds €${fmt(result.propertyValueUpliftMin)}–€${fmt(result.propertyValueUpliftMax)} to resale value.`}
            </p>
          )}

          {/* Combination warnings */}
          {result.requiresBefore && result.requiresBefore.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
              {result.requiresBefore.map(req => (
                <p key={req} className="text-xs text-amber-700">
                  ⚠{' '}
                  {locale === 'nl'
                    ? `Minder effectief zonder ${upgradeNames[req]?.nl ?? req} — overweeg dit eerst.`
                    : `Less effective without ${upgradeNames[req]?.en ?? req} — consider doing that first.`}
                </p>
              ))}
            </div>
          )}

          {result.benefitsFrom && result.benefitsFrom.filter(b => b.saving !== '0%').length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1">
              {result.benefitsFrom.filter(b => b.saving !== '0%').map(b => (
                <p key={b.upgradeId} className="text-xs text-blue-700">
                  {locale === 'nl'
                    ? `Combineer met ${upgradeNames[b.upgradeId]?.nl ?? b.upgradeId} voor ~${b.saving} besparing op installatiekosten.`
                    : `Combine with ${upgradeNames[b.upgradeId]?.en ?? b.upgradeId} to save ~${b.saving} on installation cost.`}
                </p>
              ))}
            </div>
          )}

          {isHeatPump && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              {locale === 'nl'
                ? 'Let op: dit postcodegebied kan netcongestie hebben — controleer bij Netbeheer Nederland.'
                : 'Note: this area may have grid congestion — check with Netbeheer Nederland.'}
            </p>
          )}

          <p className="text-xs text-stone-400">
            {result.difficulty === 'professional'
              ? (locale === 'nl' ? 'Professionele installatie' : 'Professional installation')
              : (locale === 'nl' ? 'Zelf te doen' : 'DIY possible')}
            {' · '}{translateInstallDays(result.installDays, locale)}
            {' · '}{locale === 'nl' ? 'Levensduur' : 'Lifespan'}: {result.lifespanYears} {locale === 'nl' ? 'jaar' : 'years'}
          </p>

          <p className="text-xs text-stone-400 italic">
            {result.dataSource === 'ep-online'
              ? (locale === 'nl' ? 'Op basis van jouw geregistreerde EPC-data' : 'Based on your registered EPC data')
              : result.dataSource === 'energy-bill'
              ? (locale === 'nl' ? 'Op basis van jouw werkelijke energierekening' : 'Based on your actual energy bill')
              : (locale === 'nl' ? 'Geschat op basis van het bouwjaar' : 'Estimated from your build era')}
            {' · '}
            <a href="/methodology" className="underline underline-offset-2 hover:text-stone-600 not-italic">
              {locale === 'nl' ? 'Hoe we berekenen' : 'How we calculate'}
            </a>
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors">
              {locale === 'nl' ? 'Vraag Claude ↗' : 'Ask Claude ↗'}
            </button>
            <a href="/quote" className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors">
              {locale === 'nl' ? 'Ontvang offertes ↗' : 'Get quotes ↗'}
            </a>
            {subsidies.length > 0 && subsidies[0].url && (
              <a
                href={subsidies[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-green-200 rounded-full transition-colors"
              >
                {locale === 'nl' ? 'Subsidie aanvragen ↗' : 'Apply for subsidy ↗'}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
