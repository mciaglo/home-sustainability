'use client'

import { useLocale } from '@/lib/locale-context'
import { fmt } from '@/lib/constants'
import type { HomeEnergyModel } from '@/lib/recommendations'

interface Props {
  current: HomeEnergyModel
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export default function EnergyBreakdown({ current }: Props) {
  const { locale } = useLocale()
  const nl = locale === 'nl'

  const losses = current.losses
  const totalLoss = losses.walls + losses.roof + losses.floor + losses.glazing + losses.ventilation

  const items = [
    { key: 'walls', label: nl ? 'Gevels' : 'Walls', value: losses.walls, bar: 'bg-rose-400', dot: 'bg-rose-400' },
    { key: 'roof', label: nl ? 'Dak' : 'Roof', value: losses.roof, bar: 'bg-amber-400', dot: 'bg-amber-400' },
    { key: 'floor', label: nl ? 'Vloer' : 'Floor', value: losses.floor, bar: 'bg-teal-400', dot: 'bg-teal-400' },
    { key: 'glazing', label: nl ? 'Glas' : 'Glazing', value: losses.glazing, bar: 'bg-sky-400', dot: 'bg-sky-400' },
    { key: 'ventilation', label: nl ? 'Ventilatie' : 'Ventilation', value: losses.ventilation, bar: 'bg-violet-400', dot: 'bg-violet-400' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h2 className="text-sm font-semibold text-stone-700 mb-4">
        {nl ? 'Waar je energie naartoe gaat' : 'Where your energy goes'}
      </h2>

      <div className="flex gap-6">
        {/* Left: heat loss bar + legend */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-stone-500 mb-2">
            {nl ? 'Warmteverlies' : 'Heat loss'}
          </p>
          <div className="h-5 rounded-full bg-stone-100 flex overflow-hidden">
            {items.map(item => {
              const w = pct(item.value, totalLoss)
              if (w === 0) return null
              return (
                <div
                  key={item.key}
                  className={`h-full ${item.bar} first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${w}%` }}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {items.map(item => {
              const p = pct(item.value, totalLoss)
              if (p === 0) return null
              return (
                <div key={item.key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                  <span className="text-xs text-stone-600">{item.label}</span>
                  <span className="text-xs text-stone-400">{p}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: costs */}
        <div className="w-44 shrink-0 space-y-1.5">
          <p className="text-xs text-stone-500 mb-2">
            {nl ? 'Jaarlijkse kosten' : 'Annual costs'}
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">{nl ? 'Verwarming' : 'Heating'}</span>
            <span className="text-stone-700 font-medium">
              {current.heating.gasM3 > 0 ? `${fmt(Math.round(current.heating.gasM3))} m³` : `${fmt(Math.round(current.heating.electricityKwh))} kWh`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">{nl ? 'Warm water' : 'Hot water'}</span>
            <span className="text-stone-700 font-medium">
              {current.hotWater.gasM3 > 0 ? `${fmt(Math.round(current.hotWater.gasM3))} m³` : `${fmt(Math.round(current.hotWater.electricityKwh))} kWh`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">{nl ? 'Apparaten' : 'Appliances'}</span>
            <span className="text-stone-700 font-medium">{fmt(Math.round(current.applianceKwh))} kWh</span>
          </div>
          <div className="border-t border-stone-100 pt-1.5 mt-1.5 flex justify-between">
            <span className="text-sm font-semibold text-stone-700">{nl ? 'Totaal' : 'Total'}</span>
            <span className="text-sm font-bold text-stone-900">€{fmt(current.totalCostEuro)}<span className="text-xs font-normal text-stone-400">/{nl ? 'jr' : 'yr'}</span></span>
          </div>
          <p className="text-xs text-stone-400">
            {current.totalCo2Tonnes} t CO₂/{nl ? 'jr' : 'yr'}
          </p>
        </div>
      </div>
    </div>
  )
}
