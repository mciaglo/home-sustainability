'use client'

import { useLocale } from '@/lib/locale-context'
import type { EnergyLabel } from '@/types/home-profile'
import type { UpgradeResult } from '@/types/upgrade'

const LABEL_ORDER: EnergyLabel[] = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'A+', 'A++', 'A+++']

// Approximate label steps gained per upgrade
const EPC_DELTA: Partial<Record<UpgradeResult['id'], number>> = {
  'cavity-wall-insulation':    1,
  'external-wall-insulation':  2,
  'roof-insulation':           1,
  'floor-insulation':          1,
  'hr-plus-plus-glazing':      1,
  'triple-glazing':            1,
  'solar-panels':              1,
  'heat-pump-air':             2,
  'heat-pump-ground':          2,
  'hot-water-heat-pump':       1,
  'draught-proofing':          0,
  'smart-thermostat':          0,
  'mechanical-ventilation':    0,
}

const LABEL_COLOUR: Record<EnergyLabel, string> = {
  'A+++': 'bg-green-700 text-white',
  'A++':  'bg-emerald-700 text-white',
  'A+':   'bg-emerald-600 text-white',
  'A':    'bg-emerald-500 text-white',
  'B':    'bg-lime-400 text-white',
  'C':    'bg-yellow-400 text-stone-900',
  'D':    'bg-amber-400 text-stone-900',
  'E':    'bg-orange-400 text-white',
  'F':    'bg-orange-500 text-white',
  'G':    'bg-red-500 text-white',
  'unknown': 'bg-gray-300 text-stone-700',
}

interface Props {
  currentLabel: EnergyLabel
  selectedIds: Set<string>
  results: UpgradeResult[]
}

export default function EpcTracker({ currentLabel, selectedIds, results }: Props) {
  const { locale } = useLocale()

  const currentIdx = LABEL_ORDER.indexOf(currentLabel)
  const totalDelta = results
    .filter(r => selectedIds.has(r.id))
    .reduce((sum, r) => sum + (EPC_DELTA[r.id] ?? 0), 0)

  const potentialIdx = Math.min(currentIdx + totalDelta, LABEL_ORDER.length - 1)
  const potentialLabel = LABEL_ORDER[potentialIdx] as EnergyLabel
  const improved = potentialIdx > currentIdx

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 px-4 py-3">
      <div className="text-xs text-stone-500 leading-tight">
        {locale === 'nl' ? 'Huidig label' : 'Current label'}
      </div>
      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${LABEL_COLOUR[currentLabel]}`}>
        {currentLabel}
      </span>

      {improved && (
        <>
          <span className="text-stone-300">→</span>
          <div className="text-xs text-stone-500 leading-tight">
            {locale === 'nl' ? 'Potentieel' : 'Potential'}
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${LABEL_COLOUR[potentialLabel]}`}>
            {potentialLabel}
          </span>
          <span className="text-xs text-emerald-700 font-medium">
            +{potentialIdx - currentIdx} {locale === 'nl' ? 'stappen' : 'steps'}
          </span>
        </>
      )}

      {!improved && (
        <span className="text-xs text-stone-400 italic">
          {locale === 'nl' ? 'Selecteer maatregelen om verbetering te zien' : 'Select upgrades to see improvement'}
        </span>
      )}
    </div>
  )
}
