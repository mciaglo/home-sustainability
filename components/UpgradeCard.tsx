'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/locale-context'
import type { UpgradeResult, UpgradeTag } from '@/types/upgrade'

const CURRENT_YEAR = new Date().getFullYear()

// Tag styling
const TAG_STYLE: Record<UpgradeTag, { bg: string; text: string; label: { nl: string; en: string } }> = {
  'top-pick':      { bg: 'bg-green-100',  text: 'text-green-700',  label: { nl: 'Topaanbeveling', en: 'Top pick' } },
  'quick-win':     { bg: 'bg-blue-100',   text: 'text-blue-700',   label: { nl: 'Snel rendement', en: 'Quick win' } },
  'strong':        { bg: 'bg-green-100',  text: 'text-green-700',  label: { nl: 'Goed rendement', en: 'Strong' } },
  'high-impact':   { bg: 'bg-blue-100',   text: 'text-blue-700',   label: { nl: 'Grote impact',   en: 'High impact' } },
  'long-game':     { bg: 'bg-amber-100',  text: 'text-amber-700',  label: { nl: 'Lange termijn',  en: 'Long game' } },
  'comfort-boost': { bg: 'bg-purple-100', text: 'text-purple-700', label: { nl: 'Meer comfort',   en: 'Comfort boost' } },
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
  onToggleSelect: () => void
  upgradeNames: Record<string, { nl: string; en: string }>
}

export default function UpgradeCard({ result, selected, onToggleSelect, upgradeNames }: Props) {
  const { locale } = useLocale()
  const [expanded, setExpanded] = useState(false)

  const name = locale === 'nl' ? (upgradeNames[result.id]?.nl ?? result.id) : (upgradeNames[result.id]?.en ?? result.id)

  const recoupPct = Math.min(100, (result.paybackYears / result.lifespanYears) * 100)
  const freePct = Math.max(0, 100 - recoupPct)

  const isBlocked = result.blockedForVvE
  const isHeatPump = result.id === 'heat-pump-air' || result.id === 'heat-pump-ground'

  // Cost display helpers
  const hasSubsidy = result.subsidies.length > 0
  const avgGross = Math.round((result.costMin + result.costMax) / 2)
  const avgNet = Math.round((result.netCostMin + result.netCostMax) / 2)

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      isBlocked
        ? 'border-gray-200 bg-gray-50 opacity-60'
        : selected
        ? 'border-green-300 bg-white shadow-sm'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {/* ── Collapsed header ── */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={() => !isBlocked && setExpanded(e => !e)}
      >
        {/* Rank circle + select toggle */}
        <button
          onClick={e => { e.stopPropagation(); if (!isBlocked) onToggleSelect() }}
          className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${
            selected
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={locale === 'nl' ? 'Selecteren voor EPC berekening' : 'Select for EPC calculation'}
        >
          {selected ? '✓' : result.rank}
        </button>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-gray-900 ${isBlocked ? 'line-through' : ''}`}>
              {name}
            </span>
            <TagBadge tag={result.tag} locale={locale} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{result.description}</p>
        </div>

        {/* Monthly saving + payback */}
        <div className="text-right flex-shrink-0">
          {isBlocked ? (
            <span className="text-xs text-gray-400">
              {locale === 'nl' ? 'VvE vereist' : 'VvE required'}
            </span>
          ) : (
            <>
              <p className="text-lg font-bold text-green-600">
                €{fmt(result.monthlySaving)}<span className="text-xs font-normal text-gray-400">/mo</span>
              </p>
              <p className="text-xs text-gray-400">{result.paybackYears}j terugverdient</p>
            </>
          )}
        </div>

        {/* Chevron */}
        {!isBlocked && (
          <span className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        )}
      </div>

      {/* ── VvE blocked explanation ── */}
      {isBlocked && (
        <div className="px-5 pb-4">
          <p className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
            {locale === 'nl'
              ? 'Deze maatregel vereist aanpassingen aan de buitenkant — overleg eerst met je VvE.'
              : 'This upgrade requires exterior changes — check with your VvE first.'}
          </p>
        </div>
      )}

      {/* ── Expanded body ── */}
      {expanded && !isBlocked && (
        <div className="border-t border-gray-100 px-5 pb-6 pt-5 space-y-5">

          {/* 1. Body header */}
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <TagBadge tag={result.tag} locale={locale} />
          </div>

          {/* 2. Financial grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {locale === 'nl' ? 'Totale kosten' : 'Total cost'}
              </p>
              {hasSubsidy ? (
                <>
                  <p className="text-sm text-gray-400 line-through">€{fmt(avgGross)}</p>
                  <p className="text-xl font-bold text-gray-900">€{fmt(avgNet)}</p>
                  {result.subsidies.map((s, i) => (
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
                <p className="text-xl font-bold text-gray-900">
                  €{fmt(result.costMin)}–{fmt(result.costMax)}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">
                {locale === 'nl' ? 'Maandelijkse besparing' : 'Monthly saving'}
              </p>
              <p className="text-xl font-bold text-green-600">€{fmt(result.monthlySaving)}/mo</p>
              <p className="text-xs text-gray-400 mt-0.5">
                €{fmt(result.annualSaving)}/{locale === 'nl' ? 'jaar' : 'yr'}
              </p>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 3. Timing section */}
          <div>
            <div className="grid grid-cols-[1fr_1px_1fr] gap-4 items-start mb-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{result.paidOffYear}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {locale === 'nl'
                    ? `Terugverdiend in ${result.paybackYears} jaar`
                    : `Paid off in ${result.paybackYears} years`}
                </p>
              </div>
              <div className="bg-gray-200 self-stretch" />
              <div>
                <p className="text-base font-bold text-green-600">
                  {result.freeSavingsYears} {locale === 'nl' ? 'jaar gratis besparing' : 'years free savings'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ~€{fmt(result.totalReturn)} {locale === 'nl' ? `t/m ${CURRENT_YEAR + result.lifespanYears}` : `by ${CURRENT_YEAR + result.lifespanYears}`}
                </p>
              </div>
            </div>

            {/* Red/green payback bar */}
            <div className="space-y-1.5">
              <div className="flex rounded-full overflow-hidden h-3">
                <div className="bg-red-400" style={{ width: `${recoupPct}%` }} />
                <div className="bg-green-400" style={{ width: `${freePct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{locale === 'nl' ? 'Nu' : 'Now'}</span>
                <span>{result.paidOffYear}</span>
                <span>{CURRENT_YEAR + result.lifespanYears}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 4. Supporting pillars */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">{locale === 'nl' ? 'CO₂-reductie' : 'CO₂ reduction'}</p>
              <p className="text-base font-semibold text-gray-900">
                {result.co2SavedTonnesPerYear.toFixed(1)} t{locale === 'nl' ? '/jaar' : '/yr'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                = {fmt(result.co2DrivingKmEquivalent)} km {locale === 'nl' ? 'minder rijden/jaar' : 'less driving/yr'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">
                {locale === 'nl' ? 'Energieonafhankelijkheid' : 'Energy independence'}
              </p>
              {result.gasReductionPercent > 0 && (
                <p className="text-base font-semibold text-gray-900">
                  {result.gasReductionPercent}% {locale === 'nl' ? 'minder gas' : 'less gas'}
                </p>
              )}
              {result.electricitySelfProducedPercent > 0 && (
                <p className="text-base font-semibold text-gray-900">
                  {result.electricitySelfProducedPercent}% {locale === 'nl' ? 'zelf opgewekt' : 'self-produced'}
                </p>
              )}
            </div>
          </div>

          {/* Property value uplift */}
          {result.propertyValueUpliftMin && result.propertyValueUpliftMax && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
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

          {result.benefitsFrom && result.benefitsFrom.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1">
              {result.benefitsFrom.map(b => (
                <p key={b.upgradeId} className="text-xs text-blue-700">
                  💡{' '}
                  {locale === 'nl'
                    ? `Combineer met ${upgradeNames[b.upgradeId]?.nl ?? b.upgradeId} voor ~${b.saving} besparing op installatiekosten.`
                    : `Combine with ${upgradeNames[b.upgradeId]?.en ?? b.upgradeId} to save ~${b.saving} on installation cost.`}
                </p>
              ))}
            </div>
          )}

          {/* Grid congestion warning */}
          {isHeatPump && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              ⚡{' '}
              {locale === 'nl'
                ? 'Let op: dit postcodegebied kan netcongestie hebben — controleer bij Netbeheer Nederland.'
                : 'Note: this area may have grid congestion — check with Netbeheer Nederland.'}
            </p>
          )}

          {/* 5. Meta line */}
          <p className="text-xs text-gray-400">
            {result.difficulty === 'professional'
              ? (locale === 'nl' ? 'Professionele installatie' : 'Professional installation')
              : (locale === 'nl' ? 'Zelf te doen' : 'DIY possible')}
            {' · '}{result.installDays}
            {' · '}{locale === 'nl' ? 'Levensduur' : 'Lifespan'}: {result.lifespanYears} {locale === 'nl' ? 'jaar' : 'years'}
          </p>

          {/* Confidence indicator */}
          <p className="text-xs text-gray-400 italic">
            {result.dataSource === 'ep-online'
              ? (locale === 'nl' ? 'Op basis van jouw geregistreerde EPC-data' : 'Based on your registered EPC data')
              : result.dataSource === 'energy-bill'
              ? (locale === 'nl' ? 'Op basis van jouw werkelijke energierekening' : 'Based on your actual energy bill')
              : (locale === 'nl' ? 'Geschat op basis van het bouwjaar' : 'Estimated from your home\'s build era')}
          </p>

          {/* 6. Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              {locale === 'nl' ? 'Vraag Claude ↗' : 'Ask Claude ↗'}
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              {locale === 'nl' ? 'Installateurs vinden ↗' : 'Find installers ↗'}
            </button>
            {result.subsidies.length > 0 && (
              <a
                href={result.subsidies[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
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
