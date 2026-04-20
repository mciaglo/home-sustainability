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
import PlanPanel from '@/components/PlanPanel'
import UpgradeCard from '@/components/UpgradeCard'
import LanguageToggle from '@/components/LanguageToggle'
import type { HomeProfile, EnergyLabel } from '@/types/home-profile'
import type { UpgradeResult, PriceScenario } from '@/types/upgrade'

const UPGRADE_NAMES: Record<string, { nl: string; en: string }> = {}
for (const d of upgradeDefsRaw.upgrades) {
  UPGRADE_NAMES[d.id] = { nl: d.nameNl, en: d.nameEn }
}

type RoiGroup = 'quick' | 'good' | 'long'

function getRoiGroup(payback: number): RoiGroup {
  if (payback <= 2.5) return 'quick'
  if (payback <= 10) return 'good'
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

function getSmartDefaults(results: UpgradeResult[], currentLabel: EnergyLabel): Map<string, string> {
  const LABEL_ORDER: EnergyLabel[] = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'A+', 'A++', 'A+++']
  const EPC_DELTA: Record<string, number> = {
    'cavity-wall-insulation': 1, 'external-wall-insulation': 2,
    'roof-insulation': 1, 'floor-insulation': 1,
    'glazing': 1, 'solar-panels': 1,
    'heat-pump': 2, 'hot-water-heat-pump': 1,
  }

  const targetIdx = LABEL_ORDER.indexOf('A+++')
  const currentIdx = LABEL_ORDER.indexOf(currentLabel)
  if (currentIdx >= targetIdx) return new Map()

  const byRoi = [...results]
    .filter(r => !r.blockedForVvE && r.paybackYears < 99)
    .sort((a, b) => a.paybackYears - b.paybackYears)

  const selected = new Map<string, string>()
  let labelIdx = currentIdx

  for (const r of byRoi) {
    selected.set(r.id, r.selectedTierId ?? '')
    labelIdx += EPC_DELTA[r.id] ?? 0
    if (labelIdx >= targetIdx) break
  }

  // Deselect 3rd card by display rank to create a visual gap (✓ ✓ ○ ✓)
  // that signals cards are interactive
  if (selected.size >= 4) {
    const byRank = results.filter(r => selected.has(r.id)).sort((a, b) => a.rank - b.rank)
    const gapUpgrade = byRank[2]
    if (gapUpgrade) selected.delete(gapUpgrade.id)
  }

  return selected
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
  const [selections, setSelections] = useState<Map<string, string>>(new Map())
  const [defaultsApplied, setDefaultsApplied] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('homeProfile')
      if (!raw) { router.push('/'); return }
      setProfile(JSON.parse(raw) as Partial<HomeProfile>)
    } catch {
      router.push('/')
    }
  }, [router])

  const results = useMemo<UpgradeResult[]>(() => {
    if (!profile) return []
    const province = getProvinceFromPostcode(profile.postcode ?? '1000')
    return calculateRecommendations(profile as HomeProfile, province, undefined, scenario)
  }, [profile, scenario])

  useEffect(() => {
    if (results.length && !defaultsApplied) {
      const currentLabel = (profile?.energyLabel ?? 'unknown') as EnergyLabel
      setSelections(getSmartDefaults(results, currentLabel))
      setDefaultsApplied(true)
    }
  }, [results, defaultsApplied, profile?.energyLabel])

  function toggleSelect(id: string, tierId?: string) {
    setSelections(prev => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, tierId ?? '')
      return next
    })
  }

  function changeTier(id: string, tierId: string) {
    setSelections(prev => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.set(id, tierId)
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

  const neighbourLabel = profile.postcodeAverageLabel
  const currentLabel = (profile.energyLabel ?? 'unknown') as EnergyLabel

  const cardList = sortMode === 'roi' ? (
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
                  selected={selections.has(r.id)}
                  selectedTierId={selections.get(r.id)}
                  onToggleSelect={(tierId) => toggleSelect(r.id, tierId ?? r.selectedTierId)}
                  onChangeTier={(tierId) => changeTier(r.id, tierId)}
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
          selected={selections.has(r.id)}
          selectedTierId={selections.get(r.id)}
          onToggleSelect={(tierId) => toggleSelect(r.id, tierId ?? r.selectedTierId)}
          onChangeTier={(tierId) => changeTier(r.id, tierId)}
          upgradeNames={UPGRADE_NAMES}
        />
      ))}
    </div>
  )

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/profile" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            ← {profile.address}
          </a>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Home summary */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-stone-900">
            {profile.address}
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {profile.yearBuilt} · {profile.floorArea} m²
            {profile.buildingType ? ` · ${t(`buildingType.${profile.buildingType}` as Parameters<typeof t>[0])}` : ''}
          </p>
          {neighbourLabel && currentLabel !== 'unknown' && (
            <p className="text-sm text-stone-500 mt-1">
              {locale === 'nl'
                ? `Woningen in jouw postcode hebben gemiddeld label ${neighbourLabel} — jij hebt label ${currentLabel}`
                : `Homes in your postcode average label ${neighbourLabel} — yours is label ${currentLabel}`}
            </p>
          )}
        </div>

        {/* Summary strip */}
        <div className="mb-5">
          <SummaryStrip results={results} />
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Left: cards */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <SortControls value={sortMode} onChange={setSortMode} />
              <PriceScenarioToggle
                value={scenario}
                onChange={s => { setScenario(s); setDefaultsApplied(false); setSelections(new Map()) }}
                hasContract={!!(profile?.contractGasEuroPerM3 || profile?.contractElectricityEuroPerKwh)}
              />
            </div>

            {/* Cards */}
            {cardList}

            {/* Footer links */}
            <div className="pt-4 pb-16 lg:pb-4 flex flex-wrap justify-center gap-x-4 gap-y-1">
              <a
                href="/methodology"
                className="text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2"
              >
                {locale === 'nl' ? 'Hoe we berekenen' : 'How we calculate'}
              </a>
              <span className="text-stone-300">·</span>
              <a
                href="/quote"
                className="text-sm text-stone-500 hover:text-stone-700 underline underline-offset-2"
              >
                {locale === 'nl'
                  ? 'Ontvang gratis offertes →'
                  : 'Get free quotes →'}
              </a>
            </div>
          </div>

          {/* Right: plan panel */}
          <div className="w-72 flex-shrink-0">
            <PlanPanel
              currentLabel={currentLabel}
              selections={selections}
              results={results}
              upgradeNames={UPGRADE_NAMES}
              onRemove={id => toggleSelect(id)}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
