'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'
import { calculateRecommendations } from '@/lib/recommendations'
import { getProvinceFromPostcode } from '@/lib/postcode-province'
import upgradeDefsRaw from '@/data/static/upgrade-definitions.json'
import SummaryStrip from '@/components/SummaryStrip'
import SortControls, { type SortMode } from '@/components/SortControls'
import PriceScenarioToggle from '@/components/PriceScenarioToggle'
import EpcTracker from '@/components/EpcTracker'
import UpgradeCard from '@/components/UpgradeCard'
import LanguageToggle from '@/components/LanguageToggle'
import type { HomeProfile, EnergyLabel } from '@/types/home-profile'
import type { UpgradeResult, PriceScenario } from '@/types/upgrade'

// Build upgrade name lookup from static defs
const UPGRADE_NAMES: Record<string, { nl: string; en: string }> = {}
for (const d of upgradeDefsRaw.upgrades) {
  UPGRADE_NAMES[d.id] = { nl: d.nameNl, en: d.nameEn }
}

type RoiGroup = 'quick' | 'good' | 'long'

function getRoiGroup(payback: number): RoiGroup {
  if (payback <= 2.5) return 'quick'
  if (payback <= 10)  return 'good'
  return 'long'
}

function sortResults(results: UpgradeResult[], mode: SortMode): UpgradeResult[] {
  const sorted = [...results]
  switch (mode) {
    case 'savings':      return sorted.sort((a, b) => b.annualSaving - a.annualSaving)
    case 'roi':          return sorted.sort((a, b) => a.paybackYears - b.paybackYears)
    case 'co2':          return sorted.sort((a, b) => b.co2SavedTonnesPerYear - a.co2SavedTonnesPerYear)
    case 'independence': return sorted.sort((a, b) => (b.gasReductionPercent + b.electricitySelfProducedPercent) - (a.gasReductionPercent + a.electricitySelfProducedPercent))
    default:             return sorted
  }
}

function RoiGroupHeading({ group, locale }: { group: RoiGroup; locale: string }) {
  const labels: Record<RoiGroup, { nl: string; en: string; colour: string }> = {
    quick: { nl: 'Snel rendement (< 2.5 jaar)', en: 'Quick wins (under 2.5 yr)', colour: 'text-blue-700' },
    good:  { nl: 'Goede investering (2.5–10 jaar)', en: 'Good investments (2.5–10 yr)', colour: 'text-green-700' },
    long:  { nl: 'Lange termijn (10+ jaar)', en: 'Long game (10+ yr)', colour: 'text-amber-700' },
  }
  const l = labels[group]
  return (
    <h2 className={`text-sm font-semibold uppercase tracking-wide ${l.colour} mt-6 mb-2`}>
      {locale === 'nl' ? l.nl : l.en}
    </h2>
  )
}

export default function ResultsPage() {
  const { locale, t } = useLocale()
  const router = useRouter()

  const [profile, setProfile] = useState<Partial<HomeProfile> | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('savings')
  const [scenario, setScenario] = useState<PriceScenario>('current')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Load profile from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('homeProfile')
      if (!raw) { router.push('/'); return }
      setProfile(JSON.parse(raw) as Partial<HomeProfile>)
    } catch {
      router.push('/')
    }
  }, [router])

  // Run recommendations engine (re-runs when scenario or profile changes)
  const results = useMemo<UpgradeResult[]>(() => {
    if (!profile) return []
    const province = getProvinceFromPostcode(profile.postcode ?? '1000')
    return calculateRecommendations(profile as HomeProfile, province, undefined, scenario)
  }, [profile, scenario])

  // Auto-select all non-blocked upgrades on first load
  useEffect(() => {
    if (results.length && selectedIds.size === 0) {
      setSelectedIds(new Set(results.filter(r => !r.blockedForVvE).map(r => r.id)))
    }
  }, [results]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sorted = sortResults(results, sortMode)

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // Neighbour context line
  const neighbourLabel = profile.postcodeAverageLabel
  const currentLabel = profile.energyLabel ?? 'unknown'

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/profile" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← {profile.address}
          </a>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Home summary */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.address}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profile.yearBuilt} · {profile.floorArea} m²
            {profile.buildingType ? ` · ${t(`buildingType.${profile.buildingType}` as Parameters<typeof t>[0])}` : ''}
          </p>

          {/* Neighbour benchmarking */}
          {neighbourLabel && currentLabel !== 'unknown' && (
            <p className="text-sm text-gray-500 mt-1">
              {locale === 'nl'
                ? `Woningen in jouw postcode hebben gemiddeld label ${neighbourLabel} — jij hebt label ${currentLabel}`
                : `Homes in your postcode average label ${neighbourLabel} — yours is label ${currentLabel}`}
            </p>
          )}
        </div>

        {/* Summary strip */}
        <SummaryStrip results={results} />

        {/* EPC tracker */}
        <EpcTracker
          currentLabel={currentLabel as EnergyLabel}
          selectedIds={selectedIds}
          results={results}
        />

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SortControls value={sortMode} onChange={setSortMode} />
          <div className="sm:ml-auto">
            <PriceScenarioToggle value={scenario} onChange={s => { setScenario(s); setSelectedIds(new Set()) }} />
          </div>
        </div>

        {/* Upgrade cards */}
        {sortMode === 'roi' ? (
          // ROI mode: grouped sections
          (() => {
            const groups: RoiGroup[] = ['quick', 'good', 'long']
            return groups.map(group => {
              const cards = sorted.filter(r => getRoiGroup(r.paybackYears) === group)
              if (cards.length === 0) return null
              return (
                <div key={group}>
                  <RoiGroupHeading group={group} locale={locale} />
                  <div className="space-y-3">
                    {cards.map(r => (
                      <UpgradeCard
                        key={r.id}
                        result={r}
                        selected={selectedIds.has(r.id)}
                        onToggleSelect={() => toggleSelect(r.id)}
                        upgradeNames={UPGRADE_NAMES}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          })()
        ) : (
          <div className="space-y-3">
            {sorted.map(r => (
              <UpgradeCard
                key={r.id}
                result={r}
                selected={selectedIds.has(r.id)}
                onToggleSelect={() => toggleSelect(r.id)}
                upgradeNames={UPGRADE_NAMES}
              />
            ))}
          </div>
        )}

        {/* Financing link */}
        <div className="pt-4 text-center">
          <a
            href="/financing"
            className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            {locale === 'nl'
              ? 'Bekijk financieringsopties en 10-jaar kostenmodel →'
              : 'View financing options and 10-year cost model →'}
          </a>
        </div>
      </div>
    </main>
  )
}
