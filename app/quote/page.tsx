'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/locale-context'
import { getProvinceFromPostcode } from '@/lib/postcode-province'
import { calculateRecommendations } from '@/lib/recommendations'
import upgradeDefsRaw from '@/data/static/upgrade-definitions.json'
import installerCounts from '@/data/static/installer-counts.json'
import LanguageToggle from '@/components/LanguageToggle'
import { fmt } from '@/lib/constants'
import type { HomeProfile } from '@/types/home-profile'
import type { UpgradeResult, PriceScenario } from '@/types/upgrade'

const UPGRADE_NAMES: Record<string, { nl: string; en: string }> = {}
for (const d of upgradeDefsRaw.upgrades) {
  UPGRADE_NAMES[d.id] = { nl: d.nameNl, en: d.nameEn }
}

function CostInfoBubble({ nl }: { nl: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [open])

  return (
    <span className="relative inline-block ml-1" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-stone-200 text-stone-500 text-[10px] font-bold hover:bg-stone-300 transition-colors"
        aria-label="Info"
      >
        i
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-20 w-60 bg-white border border-stone-200 rounded-lg shadow-lg p-3 text-xs text-stone-600 leading-relaxed">
          {nl
            ? 'Kosten zijn geschat op basis van gangbare prijzen van Milieu Centraal voor jouw woningtype. Werkelijke offertes kunnen afwijken op basis van de specifieke situatie van jouw woning.'
            : 'Costs are estimated based on typical prices from Milieu Centraal for your home type. Actual quotes may vary based on your home\'s specific situation.'}
        </div>
      )}
    </span>
  )
}

export default function QuotePage() {
  const { locale } = useLocale()
  const router = useRouter()
  const nl = locale === 'nl'

  const [profile, setProfile] = useState<Partial<HomeProfile> | null>(null)
  const [selections, setSelections] = useState<Map<string, string>>(new Map())
  const [scenario, setScenario] = useState<PriceScenario>('current')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const profileRaw = sessionStorage.getItem('homeProfile')
      if (!profileRaw) { router.push('/'); return }
      setProfile(JSON.parse(profileRaw))

      const selectionsRaw = sessionStorage.getItem('quoteSelections')
      if (selectionsRaw) {
        const parsed = JSON.parse(selectionsRaw)
        setSelections(new Map(Object.entries(parsed.selections || {})))
        if (parsed.scenario) setScenario(parsed.scenario)
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

  const selectedUpgrades = results.filter(r => selections.has(r.id))

  const upgradeDetails = selectedUpgrades.map(r => {
    const tierId = selections.get(r.id) ?? ''
    const tier = r.tiers?.find(t => t.tierId === tierId)
    const annualSaving = tier?.annualSaving ?? r.annualSaving
    const costMin = tier?.costMin ?? r.costMin
    const costMax = tier?.costMax ?? r.costMax
    const tierLabel = tier ? (nl ? tier.labelNl : tier.labelEn) : null
    return {
      name: nl ? (UPGRADE_NAMES[r.id]?.nl ?? r.id) : (UPGRADE_NAMES[r.id]?.en ?? r.id),
      tier: tierLabel ?? '',
      costRange: `€${fmt(costMin)}–${fmt(costMax)}`,
      annualSaving,
      netCostAvg: tier ? Math.round((tier.netCostMin + tier.netCostMax) / 2) : Math.round((r.netCostMin + r.netCostMax) / 2),
    }
  })

  const totalAnnualSaving = upgradeDetails.reduce((s, u) => s + u.annualSaving, 0)
  const twentyYearNet = upgradeDetails.reduce((s, u) => s + Math.max(0, u.annualSaving * 20 - u.netCostAvg), 0)

  const province = getProvinceFromPostcode(profile?.postcode ?? '1000')
  const installerCount = (installerCounts.provinces as Record<string, number>)[province] ?? 15

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent || !name || !email || !phone) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          consent,
          postcode: profile?.postcode ?? '',
          province,
          yearBuilt: profile?.yearBuilt ?? 0,
          floorArea: profile?.floorArea ?? 0,
          buildingType: profile?.buildingType ?? '',
          energyLabel: profile?.energyLabel ?? 'unknown',
          scenario,
          upgrades: upgradeDetails.map(u => ({
            name: u.name,
            tier: u.tier,
            costRange: u.costRange,
            annualSaving: u.annualSaving,
          })),
          totalAnnualSaving,
          twentyYearNet,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
    } catch {
      setError(nl ? 'Er ging iets mis. Probeer het opnieuw.' : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/results" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            ← {nl ? 'Terug naar resultaten' : 'Back to results'}
          </a>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {submitted ? (
          /* Thank you state */
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-stone-900">
              {nl ? 'Aanvraag verstuurd!' : 'Request sent!'}
            </h1>
            <p className="text-stone-600">
              {nl
                ? 'We nemen binnen 2 werkdagen contact met je op om je te matchen met gecertificeerde installateurs in je regio.'
                : 'We\'ll contact you within 2 business days to match you with certified installers in your area.'}
            </p>
            <p className="text-sm text-stone-400">
              {nl
                ? 'Een bevestiging is verstuurd naar '
                : 'A confirmation has been sent to '}
              <strong>{email}</strong>
            </p>
            <a
              href="/results"
              className="inline-block mt-4 px-6 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors"
            >
              {nl ? '← Terug naar resultaten' : '← Back to results'}
            </a>
          </div>
        ) : (
          <>
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                {nl ? 'Ontvang gratis offertes' : 'Get free quotes'}
              </h1>
              <p className="text-stone-500 mt-1">
                {nl
                  ? 'Ontvang vrijblijvend offertes van gecertificeerde installateurs in jouw regio.'
                  : 'Receive no-obligation quotes from certified installers in your area.'}
              </p>
            </div>

            {/* Upgrade summary */}
            {selectedUpgrades.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-stone-700 flex items-center">
                  {nl ? 'Jouw geselecteerde maatregelen' : 'Your selected upgrades'}
                  <CostInfoBubble nl={nl} />
                </h2>
                <ul className="space-y-2">
                  {upgradeDetails.map(u => (
                    <li key={u.name} className="flex items-center justify-between text-sm">
                      <span className="text-stone-700">
                        {u.name}
                        {u.tier && <span className="text-stone-400 ml-1">· {u.tier}</span>}
                      </span>
                      <span className="text-stone-500">{u.costRange}</span>
                    </li>
                  ))}
                </ul>
                <hr className="border-stone-100" />
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">{nl ? 'Jaarlijkse besparing' : 'Annual savings'}</span>
                  <span className="font-bold text-emerald-700">€{fmt(totalAnnualSaving)}/{nl ? 'jr' : 'yr'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">{nl ? '20-jaar netto' : '20-year net'}</span>
                  <span className="font-bold text-emerald-700">€{fmt(twentyYearNet)}</span>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-700 mb-4">
                {nl ? 'Hoe het werkt' : 'How it works'}
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  {
                    step: '1',
                    title: nl ? 'Verstuur je plan' : 'Send your plan',
                    desc: nl ? '30 seconden' : '30 seconds',
                  },
                  {
                    step: '2',
                    title: nl ? 'Wij matchen' : 'We match',
                    desc: nl ? 'Gekwalificeerde installateurs in jouw regio' : 'Qualified installers in your area',
                  },
                  {
                    step: '3',
                    title: nl ? 'Ontvang offertes' : 'Get quotes',
                    desc: nl ? 'Max. 3 offertes per maatregel' : 'Up to 3 quotes per upgrade',
                  },
                ].map(s => (
                  <div key={s.step} className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center mx-auto">
                      {s.step}
                    </div>
                    <p className="text-sm font-medium text-stone-700">{s.title}</p>
                    <p className="text-xs text-stone-400">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust section */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <p className="text-sm text-emerald-800 font-medium">
                {nl
                  ? `We vonden ${installerCount} installatiebedrijven met 4+ sterren op Google in ${province}`
                  : `We found ${installerCount} installation companies rated 4+ stars on Google in ${province}`}
              </p>
              <p className="text-sm text-emerald-700">
                {nl
                  ? 'We werken alleen met RVO-erkende installateurs, zodat je subsidieaanvraag altijd geldig is.'
                  : 'We only work with RVO-recognised installers, so your subsidy application is always eligible.'}
              </p>
              <p className="text-sm text-emerald-700">
                {nl
                  ? 'Alle installateurs zijn InstallQ-geregistreerd en gecontroleerd op kwaliteit.'
                  : 'All installers are InstallQ-registered and vetted for quality.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-stone-700">
                {nl ? 'Jouw gegevens' : 'Your details'}
              </h2>

              {profile?.postcode && (
                <div>
                  <label className="block text-xs text-stone-500 mb-1">{nl ? 'Postcode' : 'Postcode'}</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.postcode}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 text-stone-500 cursor-default"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    {nl
                      ? 'Alleen je postcode wordt gedeeld, niet je adres.'
                      : 'Only your postcode is shared, not your address.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs text-stone-500 mb-1">{nl ? 'Naam' : 'Name'}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">{nl ? 'E-mailadres' : 'Email'}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">{nl ? 'Telefoonnummer' : 'Phone'}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-stone-400 mt-1">
                  {nl
                    ? 'Installateurs bellen liever dan mailen — dit versnelt je offerte.'
                    : 'Installers prefer calling over email — this speeds up your quote.'}
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 accent-emerald-700"
                />
                <span className="text-xs text-stone-600">
                  {nl
                    ? 'Ik ga akkoord dat mijn contactgegevens worden gedeeld met maximaal 3 installateurs per maatregel voor het ontvangen van een offerte. Zie ons '
                    : 'I agree that my contact details will be shared with up to 3 installers per upgrade to receive a quote. See our '}
                  <a href="/privacy" className="underline text-emerald-700 hover:text-emerald-800">
                    {nl ? 'privacybeleid' : 'privacy policy'}
                  </a>.
                </span>
              </label>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !consent || !name || !email || !phone}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold text-sm text-center rounded-xl transition-colors"
              >
                {submitting
                  ? (nl ? 'Verzenden...' : 'Sending...')
                  : (nl ? 'Verstuur mijn aanvraag' : 'Send my request')}
              </button>

              <p className="text-xs text-stone-400 text-center">
                {nl ? 'Gratis · Vrijblijvend · Max. 3 installateurs per maatregel' : 'Free · No obligation · Up to 3 installers per upgrade'}
              </p>
            </form>
          </>
        )}

      </div>
    </main>
  )
}
