import type { EnergyLabel } from '@/types/home-profile'

export const LABEL_ORDER: EnergyLabel[] = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'A+', 'A++', 'A+++']

export const LABEL_COLOURS: Record<EnergyLabel, string> = {
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

export const EPC_DELTA: Record<string, number> = {
  'cavity-wall-insulation': 1,
  'external-wall-insulation': 2,
  'roof-insulation': 1,
  'floor-insulation': 1,
  'glazing': 1,
  'solar-panels': 1,
  'heat-pump': 2,
  'hybrid-heat-pump': 1,
  'heat-pump-air': 2,
  'heat-pump-ground': 2,
  'hot-water-heat-pump': 1,
  'draught-proofing': 0,
  'smart-thermostat': 0,
  'mechanical-ventilation': 0,
  'home-battery': 0,
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('nl-NL')
}
