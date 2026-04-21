'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'
import StreetViewStub from './StreetViewStub'
import { LABEL_COLOURS } from '@/lib/constants'
import type { HomeProfile, BuildingType, EnergyLabel, HeatingType, InsulationLevel } from '@/types/home-profile'

const BUILDING_TYPES: BuildingType[] = ['terraced', 'semi-detached', 'detached', 'corner', 'apartment']
const ENERGY_LABELS: EnergyLabel[] = ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
const HEATING_TYPES: HeatingType[] = ['gas-boiler', 'heat-pump-air', 'heat-pump-ground', 'district-heating', 'electric', 'unknown']
const INSULATION_LEVELS: InsulationLevel[] = ['none', 'partial', 'good', 'very-good', 'unknown']

const INSULATION_LABELS: Record<InsulationLevel, { nl: string; en: string }> = {
  none:      { nl: 'Geen',       en: 'None' },
  partial:   { nl: 'Gedeeltelijk', en: 'Partial' },
  good:      { nl: 'Goed',       en: 'Good' },
  'very-good': { nl: 'Zeer goed', en: 'Very good' },
  unknown:   { nl: 'Onbekend',   en: 'Unknown' },
}

interface Props {
  profile: Partial<HomeProfile>
  streetViewUrl?: string | null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

function SelectField<T extends string>({
  value,
  options,
  onChange,
  labelFn,
}: {
  value: T
  options: T[]
  onChange: (v: T) => void
  labelFn: (v: T) => string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-stone-900"
    >
      {options.map(o => (
        <option key={o} value={o}>{labelFn(o)}</option>
      ))}
    </select>
  )
}

export default function HomeProfileForm({ profile: initial, streetViewUrl }: Props) {
  const { t, locale } = useLocale()
  const router = useRouter()

  const [yearBuilt, setYearBuilt] = useState(initial.yearBuilt ?? 1975)
  const [floorArea, setFloorArea] = useState(initial.floorArea ?? 100)
  const [buildingType, setBuildingType] = useState<BuildingType>(initial.buildingType ?? 'terraced')
  const [energyLabel, setEnergyLabel] = useState<EnergyLabel>(initial.energyLabel ?? 'unknown')
  const [heatingType, setHeatingType] = useState<HeatingType>(initial.heatingType ?? 'gas-boiler')
  const [wallInsulation, setWallInsulation] = useState<InsulationLevel>(initial.insulation?.wall ?? 'unknown')
  const [roofInsulation, setRoofInsulation] = useState<InsulationLevel>(initial.insulation?.roof ?? 'unknown')
  const [floorInsulation, setFloorInsulation] = useState<InsulationLevel>(initial.insulation?.floor ?? 'unknown')
  const [glazingInsulation, setGlazingInsulation] = useState<InsulationLevel>(initial.insulation?.glazing ?? 'unknown')
  const [billUploaded, setBillUploaded] = useState(false)
  const [actualGas, setActualGas] = useState<string>(initial.estimatedGasM3PerYear?.toString() ?? '')
  const [actualKwh, setActualKwh] = useState<string>(initial.estimatedElectricityKwhPerYear?.toString() ?? '')
  const [contractGas, setContractGas] = useState<string>(initial.contractGasEuroPerM3?.toString() ?? '')
  const [contractElectricity, setContractElectricity] = useState<string>(initial.contractElectricityEuroPerKwh?.toString() ?? '')

  const [hasSolar, setHasSolar] = useState(initial.existingUpgrades?.solarPanels?.has ?? false)
  const [solarCount, setSolarCount] = useState(initial.existingUpgrades?.solarPanels?.count ?? 10)
  const [hasHeatPump, setHasHeatPump] = useState(initial.existingUpgrades?.heatPump?.has ?? false)
  const [heatPumpType, setHeatPumpType] = useState<'air-source' | 'ground-source'>(initial.existingUpgrades?.heatPump?.type ?? 'air-source')
  const [hasBattery, setHasBattery] = useState(initial.existingUpgrades?.homeBattery?.has ?? false)

  const isMonument = initial.isMonument ?? false
  const isVvE = initial.isVvE ?? false

  function insulationLabel(level: InsulationLevel) {
    return locale === 'nl' ? INSULATION_LABELS[level].nl : INSULATION_LABELS[level].en
  }

  function handleBillUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBillUploaded(true)
    setActualGas('1650')
    setActualKwh('3100')
  }

  function handleConfirm() {
    const gasVal = actualGas ? parseInt(actualGas, 10) : (initial.estimatedGasM3PerYear ?? 1500)
    const kwhVal = actualKwh ? parseInt(actualKwh, 10) : (initial.estimatedElectricityKwhPerYear ?? 3200)
    const gasCost = (contractGas ? parseFloat(contractGas) : 1.28)
    const elecCost = (contractElectricity ? parseFloat(contractElectricity) : 0.32)

    const correctedProfile: Partial<HomeProfile> = {
      ...initial,
      yearBuilt,
      floorArea,
      buildingType,
      energyLabel,
      heatingType,
      insulation: {
        wall: wallInsulation,
        roof: roofInsulation,
        floor: floorInsulation,
        glazing: glazingInsulation,
      },
      userCorrected: true,
      hasUploadedBill: billUploaded,
      estimatedGasM3PerYear: gasVal,
      estimatedElectricityKwhPerYear: kwhVal,
      estimatedEnergyCostPerYear: Math.round(gasVal * gasCost + kwhVal * elecCost),
      contractGasEuroPerM3: contractGas ? parseFloat(contractGas) : undefined,
      contractElectricityEuroPerKwh: contractElectricity ? parseFloat(contractElectricity) : undefined,
      existingUpgrades: {
        solarPanels: hasSolar ? { has: true, count: solarCount } : undefined,
        heatPump: hasHeatPump ? { has: true, type: heatPumpType } : undefined,
        homeBattery: hasBattery ? { has: true } : undefined,
      },
      dataSource: actualGas || actualKwh ? 'energy-bill' : initial.dataSource,
    }

    sessionStorage.setItem('homeProfile', JSON.stringify(correctedProfile))
    router.push('/results')
  }

  return (
    <div className="space-y-6">
      {/* Street View / home photo */}
      <StreetViewStub
        address={initial.address ?? ''}
        imageUrl={streetViewUrl}
      />

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {isMonument && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full"
            title={t('profile.monumentTooltip')}
          >
            🏛 {t('profile.monument')}
          </span>
        )}
        {isVvE && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
            🏢 {t('profile.vve')}
          </span>
        )}
      </div>

      {isVvE && (
        <p className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          {t('profile.vveNote')}
        </p>
      )}

      {/* Core fields */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {locale === 'nl' ? 'Woninggegevens' : 'Building data'}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Year built */}
          <Field label={t('profile.yearBuilt')}>
            <input
              type="number"
              value={yearBuilt}
              min={1800}
              max={new Date().getFullYear()}
              onChange={e => setYearBuilt(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
            />
          </Field>

          {/* Floor area */}
          <Field label={`${t('profile.floorArea')} (m²)`}>
            <input
              type="number"
              value={floorArea}
              min={20}
              max={1000}
              onChange={e => setFloorArea(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
            />
          </Field>
        </div>

        {/* Building type */}
        <Field label={t('profile.buildingType')}>
          <SelectField
            value={buildingType}
            options={BUILDING_TYPES}
            onChange={setBuildingType}
            labelFn={v => t(`buildingType.${v}` as Parameters<typeof t>[0])}
          />
        </Field>

        {/* Energy label */}
        <Field label={t('profile.energyLabel')}>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${LABEL_COLOURS[energyLabel]}`}>
              {energyLabel}
            </span>
            <SelectField
              value={energyLabel}
              options={ENERGY_LABELS}
              onChange={setEnergyLabel}
              labelFn={v => v}
            />
          </div>
        </Field>

        {/* Heating */}
        <Field label={t('profile.heating')}>
          <SelectField
            value={heatingType}
            options={HEATING_TYPES}
            onChange={setHeatingType}
            labelFn={v => t(`heatingType.${v}` as Parameters<typeof t>[0])}
          />
        </Field>
      </div>

      {/* Insulation */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {t('profile.insulation')}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label={locale === 'nl' ? 'Muur' : 'Wall'}>
            <SelectField value={wallInsulation} options={INSULATION_LEVELS} onChange={setWallInsulation} labelFn={insulationLabel} />
          </Field>
          <Field label={locale === 'nl' ? 'Dak' : 'Roof'}>
            <SelectField value={roofInsulation} options={INSULATION_LEVELS} onChange={setRoofInsulation} labelFn={insulationLabel} />
          </Field>
          <Field label={locale === 'nl' ? 'Vloer' : 'Floor'}>
            <SelectField value={floorInsulation} options={INSULATION_LEVELS} onChange={setFloorInsulation} labelFn={insulationLabel} />
          </Field>
          <Field label={locale === 'nl' ? 'Beglazing' : 'Glazing'}>
            <SelectField value={glazingInsulation} options={INSULATION_LEVELS} onChange={setGlazingInsulation} labelFn={insulationLabel} />
          </Field>
        </div>
      </div>

      {/* Energy consumption */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {locale === 'nl' ? 'Energieverbruik' : 'Energy consumption'}
        </h2>
        <p className="text-xs text-stone-400">
          {locale === 'nl'
            ? 'Staat op je jaarafrekening — pas aan voor nauwkeurigere resultaten'
            : 'Found on your annual energy statement — adjust for more accurate results'}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Field label={locale === 'nl' ? 'Gasverbruik (m³/jaar)' : 'Gas usage (m³/yr)'}>
            <input
              type="number"
              min="0"
              max="20000"
              placeholder={String(initial.estimatedGasM3PerYear ?? 1500)}
              value={actualGas}
              onChange={e => setActualGas(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
            />
          </Field>
          <Field label={locale === 'nl' ? 'Stroomverbruik (kWh/jaar)' : 'Electricity (kWh/yr)'}>
            <input
              type="number"
              min="0"
              max="50000"
              placeholder={String(initial.estimatedElectricityKwhPerYear ?? 3200)}
              value={actualKwh}
              onChange={e => setActualKwh(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-stone-200" />
          <span className="text-xs text-stone-400">{locale === 'nl' ? 'en/of' : 'and/or'}</span>
          <hr className="flex-1 border-stone-200" />
        </div>

        {/* Contract prices */}
        <div>
          <p className="text-sm font-medium text-stone-700">
            {locale === 'nl' ? 'Jouw energietarief' : 'Your energy rate'}
          </p>
          <p className="text-xs text-stone-400 mt-0.5 mb-3">
            {locale === 'nl'
              ? 'Staat op je energiecontract of jaarafrekening'
              : 'Found on your energy contract or annual statement'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label={locale === 'nl' ? 'Gastarief (€/m³)' : 'Gas rate (€/m³)'}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="1.28"
                value={contractGas}
                onChange={e => setContractGas(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
              />
            </Field>
            <Field label={locale === 'nl' ? 'Stroomtarief (€/kWh)' : 'Electricity rate (€/kWh)'}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.32"
                value={contractElectricity}
                onChange={e => setContractElectricity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-stone-200" />
          <span className="text-xs text-stone-400">{locale === 'nl' ? 'of' : 'or'}</span>
          <hr className="flex-1 border-stone-200" />
        </div>

        {/* Bill upload */}
        <div>
          <p className="text-sm font-medium text-stone-700">{t('profile.uploadBill')}</p>
          <p className="text-xs text-stone-400 mt-0.5">{t('profile.uploadBillHint')}</p>
        </div>

        {billUploaded ? (
          <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-green-200 rounded-lg px-3 py-2">
            <span>✓</span>
            <span>
              {locale === 'nl'
                ? `Verbruik bijgewerkt: ${actualGas} m³ gas · ${actualKwh} kWh`
                : `Usage updated: ${actualGas} m³ gas · ${actualKwh} kWh`}
            </span>
          </div>
        ) : (
          <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 text-sm font-medium text-stone-600 bg-stone-50 border border-stone-200 rounded-lg hover:border-stone-400 transition-colors">
            <span>📄</span>
            <span>{locale === 'nl' ? 'PDF selecteren' : 'Select PDF'}</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleBillUpload}
            />
          </label>
        )}
      </div>

      {/* Existing upgrades */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {locale === 'nl' ? 'Bestaande maatregelen' : 'Existing upgrades'}
        </h2>
        <p className="text-xs text-stone-400">
          {locale === 'nl'
            ? 'Vink aan wat je al hebt — deze worden niet opnieuw aanbevolen'
            : 'Check what you already have — these won\'t be recommended again'}
        </p>

        <div className="space-y-3">
          {/* Solar panels */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSolar}
              onChange={e => setHasSolar(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span className="text-sm text-stone-700">
              {locale === 'nl' ? 'Zonnepanelen' : 'Solar panels'}
            </span>
          </label>
          {hasSolar && (
            <div className="ml-7">
              <Field label={locale === 'nl' ? 'Aantal panelen' : 'Number of panels'}>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={solarCount}
                  onChange={e => setSolarCount(Number(e.target.value))}
                  className="w-24 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
                />
              </Field>
            </div>
          )}

          {/* Heat pump */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHeatPump}
              onChange={e => setHasHeatPump(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span className="text-sm text-stone-700">
              {locale === 'nl' ? 'Warmtepomp' : 'Heat pump'}
            </span>
          </label>
          {hasHeatPump && (
            <div className="ml-7">
              <select
                value={heatPumpType}
                onChange={e => setHeatPumpType(e.target.value as 'air-source' | 'ground-source')}
                className="px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-stone-900"
              >
                <option value="air-source">{locale === 'nl' ? 'Lucht-water' : 'Air-source'}</option>
                <option value="ground-source">{locale === 'nl' ? 'Bodem-water' : 'Ground-source'}</option>
              </select>
            </div>
          )}

          {/* Home battery */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasBattery}
              onChange={e => setHasBattery(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span className="text-sm text-stone-700">
              {locale === 'nl' ? 'Thuisbatterij' : 'Home battery'}
            </span>
          </label>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-lg rounded-2xl transition-colors shadow-sm"
      >
        {t('profile.confirm')}
      </button>
    </div>
  )
}
