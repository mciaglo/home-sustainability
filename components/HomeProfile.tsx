'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'
import StreetViewStub from './StreetViewStub'
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

const LABEL_COLOURS: Record<EnergyLabel, string> = {
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
  const [actualGas, setActualGas] = useState<number | null>(null)
  const [actualKwh, setActualKwh] = useState<number | null>(null)
  const [contractGas, setContractGas] = useState<string>(initial.contractGasEuroPerM3?.toString() ?? '')
  const [contractElectricity, setContractElectricity] = useState<string>(initial.contractElectricityEuroPerKwh?.toString() ?? '')

  const isMonument = initial.isMonument ?? false
  const isVvE = initial.isVvE ?? false

  function insulationLabel(level: InsulationLevel) {
    return locale === 'nl' ? INSULATION_LABELS[level].nl : INSULATION_LABELS[level].en
  }

  function handleBillUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Stub: in production, use pdf.js to extract gas m³ and kWh
    // For now, simulate extraction with placeholder values
    setBillUploaded(true)
    setActualGas(1650)
    setActualKwh(3100)
  }

  function handleConfirm() {
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
      estimatedGasM3PerYear: actualGas ?? initial.estimatedGasM3PerYear ?? 1500,
      estimatedElectricityKwhPerYear: actualKwh ?? initial.estimatedElectricityKwhPerYear ?? 3200,
      contractGasEuroPerM3: contractGas ? parseFloat(contractGas) : undefined,
      contractElectricityEuroPerKwh: contractElectricity ? parseFloat(contractElectricity) : undefined,
    }

    // Store in sessionStorage and navigate to results
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

      {/* Energy data */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {locale === 'nl' ? 'Energiegegevens' : 'Energy data'}
        </h2>

        {/* Contract prices */}
        <div>
          <p className="text-sm font-medium text-stone-700">
            {locale === 'nl' ? 'Huidig energiecontract' : 'Current energy contract'}
          </p>
          <p className="text-xs text-stone-400 mt-0.5 mb-3">
            {locale === 'nl'
              ? 'Optioneel — voor nauwkeurigere besparingsberekeningen'
              : 'Optional — for more accurate savings calculations'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label={locale === 'nl' ? 'Gasprijs (€/m³)' : 'Gas price (€/m³)'}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="1.45"
                value={contractGas}
                onChange={e => setContractGas(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
              />
            </Field>
            <Field label={locale === 'nl' ? 'Stroomprijs (€/kWh)' : 'Electricity price (€/kWh)'}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.40"
                value={contractElectricity}
                onChange={e => setContractElectricity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900"
              />
            </Field>
          </div>
        </div>

        {/* Divider */}
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
