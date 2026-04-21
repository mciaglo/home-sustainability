'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'
import { calculateRecommendations, buildEnergyModel, diffModels, getScenarioPrices } from '@/lib/recommendations'
import { getProvinceFromPostcode } from '@/lib/postcode-province'
import upgradeDefsRaw from '@/data/static/upgrade-definitions.json'
import SummaryStrip from '@/components/SummaryStrip'
import SortControls, { type SortMode } from '@/components/SortControls'
import PriceScenarioToggle from '@/components/PriceScenarioToggle'
import PlanPanel from '@/components/PlanPanel'
import EnergyBreakdown from '@/components/EnergyBreakdown'
import UpgradeCard from '@/components/UpgradeCard'
import LanguageToggle from '@/components/LanguageToggle'
import { LABEL_ORDER, EPC_DELTA } from '@/lib/constants'
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
  const targetIdx = LABEL_ORDER.indexOf('A+++')
  const currentIdx = LABEL_ORDER.indexOf(currentLabel)
  if (currentIdx >= targetIdx) return new Map()

  const byRoi = [...results]
    .filter(r => !r.blockedForVvE && r.paybackYears < 99)
    .sort((a, b) => b.annualSaving - a.annualSaving)

  const selected = new Map<string, string>()
  let labelIdx = currentIdx

  for (const r of byRoi) {
    selected.set(r.id, r.selectedTierId ?? '')
    labelIdx += EPC_DELTA[r.id] ?? 0
    if (labelIdx >= targetIdx) break
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

      const saved = sessionStorage.getItem('quoteSelections')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.selections && Object.keys(parsed.selections).length > 0) {
          setSelections(new Map(Object.entries(parsed.selections)))
          setDefaultsApplied(true)
        }
      }
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

  function saveSelections(sel: Map<string, string>) {
    const obj: Record<string, string> = {}
    sel.forEach((v, k) => { obj[k] = v })
    sessionStorage.setItem('quoteSelections', JSON.stringify({ selections: obj }))
  }

  function toggleSelect(id: string, tierId?: string) {
    setSelections(prev => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, tierId ?? '')
      saveSelections(next)
      return next
    })
  }

  function changeTier(id: string, tierId: string) {
    setSelections(prev => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.set(id, tierId)
      saveSelections(next)
      return next
    })
  }

  const sorted = sortResults(results, sortMode)

  const currentModel = useMemo(() => {
    if (!profile) return null
    const province = getProvinceFromPostcode(profile.postcode ?? '1000')
    const prices = getScenarioPrices(scenario, profile)
    return buildEnergyModel(profile as HomeProfile, province, [], prices)
  }, [profile, scenario])

  const standaloneSavings = useMemo(() => {
    if (!profile || results.length === 0) return new Map<string, Map<string, { annualSaving: number; monthlySaving: number }>>()
    const province = getProvinceFromPostcode(profile.postcode ?? '1000')
    const prices = getScenarioPrices(scenario, profile)
    const hp = profile as HomeProfile
    const baseModel = buildEnergyModel(hp, province, [], prices)
    const map = new Map<string, Map<string, { annualSaving: number; monthlySaving: number }>>()

    for (const r of results) {
      const tierMap = new Map<string, { annualSaving: number; monthlySaving: number }>()
      if (r.tiers && r.tiers.length > 0) {
        for (const tier of r.tiers) {
          const withThis = buildEnergyModel(hp, province,
            [{ id: r.id, tierId: tier.tierId, params: tier.params }], prices)
          const diff = diffModels(baseModel, withThis)
          const ann = Math.round(diff.annualSavingEuro)
          tierMap.set(tier.tierId, { annualSaving: ann, monthlySaving: Math.round(ann / 12) })
        }
      } else {
        const withThis = buildEnergyModel(hp, province, [{ id: r.id }], prices)
        const diff = diffModels(baseModel, withThis)
        const ann = Math.round(diff.annualSavingEuro)
        tierMap.set('', { annualSaving: ann, monthlySaving: Math.round(ann / 12) })
      }
      map.set(r.id, tierMap)
    }
    return map
  }, [results, profile, scenario])

  const contextualSavings = useMemo(() => {
    if (!profile || results.length === 0) return new Map<string, Map<string, { annualSaving: number; monthlySaving: number }>>()
    const province = getProvinceFromPostcode(profile.postcode ?? '1000')
    const prices = getScenarioPrices(scenario, profile)
    const hp = profile as HomeProfile

    const selectedUpgrades = results
      .filter(r => selections.has(r.id))
      .map(r => {
        const tierId = selections.get(r.id) ?? r.selectedTierId ?? ''
        const tier = r.tiers?.find(t => t.tierId === tierId)
        return { id: r.id, tierId, params: tier?.params }
      })

    const baseContextModel = buildEnergyModel(hp, province, selectedUpgrades, prices)
    const map = new Map<string, Map<string, { annualSaving: number; monthlySaving: number }>>()

    for (const r of results) {
      const isSelected = selections.has(r.id)
      const context = isSelected
        ? selectedUpgrades.filter(u => u.id !== r.id)
        : selectedUpgrades
      const contextModel = isSelected
        ? buildEnergyModel(hp, province, context, prices)
        : baseContextModel

      const tierMap = new Map<string, { annualSaving: number; monthlySaving: number }>()

      if (r.tiers && r.tiers.length > 0) {
        for (const tier of r.tiers) {
          const withThis = buildEnergyModel(hp, province,
            [...context, { id: r.id, tierId: tier.tierId, params: tier.params }], prices)
          const diff = diffModels(contextModel, withThis)
          const ann = Math.round(diff.annualSavingEuro)
          tierMap.set(tier.tierId, { annualSaving: ann, monthlySaving: Math.round(ann / 12) })
        }
      } else {
        const withThis = buildEnergyModel(hp, province,
          [...context, { id: r.id }], prices)
        const diff = diffModels(contextModel, withThis)
        const ann = Math.round(diff.annualSavingEuro)
        tierMap.set('', { annualSaving: ann, monthlySaving: Math.round(ann / 12) })
      }

      map.set(r.id, tierMap)
    }
    return map
  }, [results, selections, profile, scenario])

  const selectedIdSet = useMemo(() => new Set(selections.keys()), [selections])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const neighbourLabel = profile.postcodeAverageLabel
  const currentLabel = (profile.energyLabel || 'unknown') as EnergyLabel

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
                  contextualSavings={contextualSavings.get(r.id)}
                  standaloneSavings={standaloneSavings.get(r.id)}
                  selectedIds={selectedIdSet}
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
          contextualSavings={contextualSavings.get(r.id)}
          standaloneSavings={standaloneSavings.get(r.id)}
          selectedIds={selectedIdSet}
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
          <SummaryStrip results={results} profile={profile as HomeProfile} scenario={scenario} />
        </div>

        {/* Energy breakdown */}
        {currentModel && (
          <div className="mb-5">
            <EnergyBreakdown current={currentModel} />
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Left: cards */}
          <div className="flex-1 min-w-0 space-y-4">
            <h2 className="text-lg font-bold text-stone-800">
              {locale === 'nl' ? 'Aanbevolen maatregelen' : 'Recommended upgrades'}
            </h2>
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

          {/* Plan panel: desktop sidebar + mobile bottom bar */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <PlanPanel
              currentLabel={currentLabel}
              selections={selections}
              results={results}
              upgradeNames={UPGRADE_NAMES}
              onRemove={id => toggleSelect(id)}
              profile={profile as HomeProfile}
              scenario={scenario}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
