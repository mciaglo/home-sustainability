'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/locale-context'
import LanguageToggle from '@/components/LanguageToggle'

function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-stone-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold text-stone-800">{title}</span>
        <span className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-5 pb-6 pt-2 bg-white border-t border-stone-100 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 font-mono text-sm text-stone-700 leading-relaxed">
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mt-4 mb-1">{children}</p>
}

export default function MethodologyPage() {
  const { locale } = useLocale()
  const nl = locale === 'nl'

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/results" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            ← {nl ? 'Terug naar resultaten' : 'Back to results'}
          </a>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {nl ? 'Hoe we berekenen' : 'How we calculate'}
          </h1>
          <p className="text-stone-500 mt-2">
            {nl
              ? 'Een transparante uitleg van onze methodes, aannames en databronnen.'
              : 'A transparent explanation of our methods, assumptions, and data sources.'}
          </p>
        </div>

        {/* Confidence levels — always visible */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
          <h2 className="font-semibold text-stone-800">
            {nl ? 'Jouw woningdata' : 'Your home data'}
          </h2>
          <p className="text-sm text-stone-600">
            {nl
              ? 'We halen gegevens op uit drie officiële bronnen, in volgorde van nauwkeurigheid:'
              : 'We pull data from three official sources, in order of accuracy:'}
          </p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex gap-2">
              <span className="font-medium text-emerald-700 flex-shrink-0">1.</span>
              <span>
                <strong>{nl ? 'Geregistreerde EPC (EP-Online / RVO)' : 'Registered EPC (EP-Online / RVO)'}</strong>
                {' — '}{nl ? 'Als jouw woning een officieel energielabel heeft, gebruiken we de bijbehorende U-waarden en gemeten verbruiksgegevens.' : 'If your home has a registered energy label, we use the associated U-values and measured consumption data.'}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-amber-600 flex-shrink-0">2.</span>
              <span>
                <strong>{nl ? 'Bouwjaarschatting' : 'Build-era estimate'}</strong>
                {' — '}{nl ? 'Geen geregistreerd label? Dan schatten we isolatieniveaus op basis van je bouwjaar via de NTA 8800-referentietabel.' : 'No registered label? We estimate insulation levels from your construction year using the NTA 8800 reference table.'}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-blue-600 flex-shrink-0">3.</span>
              <span>
                <strong>{nl ? 'Eigen energierekening' : 'Your energy bill'}</strong>
                {' — '}{nl ? 'Als je je werkelijke verbruik invult, vervangen die cijfers onze schatting.' : 'If you enter your actual consumption, those numbers override our estimate.'}
              </span>
            </li>
          </ul>
          <p className="text-xs text-stone-400">
            {nl
              ? 'Elk upgradekaartje toont welke bron er voor die berekening is gebruikt.'
              : 'Each upgrade card shows which source was used for that calculation.'}
          </p>
        </div>

        {/* Accordion sections */}
        <div className="space-y-3">

          {/* Insulation */}
          <AccordionSection title={nl ? 'Isolatiemaatregelen — energiebesparing' : 'Insulation upgrades — energy savings'}>
            <p className="text-sm text-stone-600">
              {nl
                ? 'Isolatie vermindert warmteverlies. We berekenen hoeveel gas je bespaart met de NTA 8800-warmteverliesformule:'
                : 'Insulation reduces heat loss. We calculate gas savings using the NTA 8800 heat-loss formula:'}
            </p>
            <Formula>
              {nl ? (
                <>
                  Bespaard gas [m³] = (U_voor − U_na) × oppervlak [m²] × HDD × 24<br />
                  {'                        '}÷ (1.000 × 8,8 kWh/m³)
                </>
              ) : (
                <>
                  Saved gas [m³] = (U_before − U_after) × area [m²] × HDD × 24<br />
                  {'                    '}÷ (1,000 × 8.8 kWh/m³)
                </>
              )}
            </Formula>
            <SectionLabel>{nl ? 'Variabelen' : 'Variables'}</SectionLabel>
            <table className="w-full text-sm text-stone-600 border-collapse">
              <tbody>
                {[
                  ['U_voor / U_before', nl ? 'U-waarde van het gebouwelement vóór renovatie (W/m²K) — uit NTA 8800-referentietabel per bouwjaar' : 'U-value of the building element before renovation (W/m²K) — from NTA 8800 reference table by build era'],
                  ['U_na / U_after', nl ? 'U-waarde na renovatie — bepaald door het gekozen niveau (bijv. Rc 4,0 → U = 0,25)' : 'U-value after renovation — set by the chosen tier (e.g. Rc 4.0 → U = 0.25)'],
                  [nl ? 'Oppervlak' : 'Area', nl ? 'Muuroppervlak = 80% van vloeroppervlak; dak = 70%; vloer = 100%; ramen = 15%' : 'Wall area = 80% of floor area; roof = 70%; floor = 100%; windows = 15%'],
                  ['HDD', nl ? 'Graaddagen — regionale klimaatdata van KNMI (landelijk gem. ~2.800)' : 'Heating degree days — regional climate data from KNMI (national avg ~2,800)'],
                  ['8,8 kWh/m³', nl ? 'Energieinhoud van aardgas' : 'Energy content of natural gas'],
                ].map(([v, d]) => (
                  <tr key={v as string} className="border-t border-stone-100">
                    <td className="py-1.5 pr-4 font-mono text-xs text-stone-700 align-top whitespace-nowrap">{v}</td>
                    <td className="py-1.5 text-stone-500 align-top">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <SectionLabel>{nl ? 'Rekenvoorbeeld' : 'Worked example'}</SectionLabel>
            <div className="bg-stone-50 rounded-lg p-4 text-sm text-stone-600 space-y-1">
              <p className="font-medium text-stone-700">{nl ? 'Spouwmuurisolatie — rijtjeswoning 1972, 95 m²' : 'Cavity wall insulation — 1972 terraced house, 95 m²'}</p>
              <p>U_voor = 1,5 W/m²K &nbsp;(1945–1974 {nl ? 'bouwjaar' : 'era'})</p>
              <p>U_na = 0,35 W/m²K</p>
              <p>{nl ? 'Muuroppervlak' : 'Wall area'} = 95 × 0,8 = 76 m²</p>
              <p>HDD = 2.800</p>
              <p className="mt-2 font-medium">= (1,5 − 0,35) × 76 × 2.800 × 24 ÷ (1.000 × 8,8)</p>
              <p className="text-emerald-700 font-bold">≈ 665 m³ {nl ? 'gas per jaar' : 'gas/year'} → ~€851/jaar</p>
            </div>
          </AccordionSection>

          {/* Other upgrades */}
          <AccordionSection title={nl ? 'Overige maatregelen — berekeningen' : 'Other upgrades — calculations'}>
            <div className="space-y-5 text-sm text-stone-600">

              <div>
                <p className="font-semibold text-stone-700 mb-1">{nl ? 'Tochtdichting' : 'Draught-proofing'}</p>
                <Formula>{nl ? 'Bespaard gas = jaarverbruik × 7%' : 'Saved gas = annual consumption × 7%'}</Formula>
                <p className="text-xs text-stone-400 mt-1">{nl ? 'Empirische schatting op basis van gemiddelde luchtlekkage in oudere woningen.' : 'Empirical estimate based on average air leakage in older homes.'}</p>
              </div>

              <div>
                <p className="font-semibold text-stone-700 mb-1">{nl ? 'Slimme thermostaat' : 'Smart thermostat'}</p>
                <Formula>{nl ? 'Bespaard gas = jaarverbruik × 12%' : 'Saved gas = annual consumption × 12%'}</Formula>
                <p className="text-xs text-stone-400 mt-1">{nl ? 'Gecombineerd effect van gedragsaanpassing en geoptimeerde stookprogramma\'s.' : 'Combined effect of behavioural adjustment and optimised heating schedules.'}</p>
              </div>

              <div>
                <p className="font-semibold text-stone-700 mb-1">{nl ? 'Zonnepanelen' : 'Solar panels'}</p>
                <Formula>
                  {nl ? (
                    <>
                      Jaarlijkse opwek [kWh] = bestraling × systeemvermogen [kWp] × 0,85<br />
                      Systeemvermogen = min(vloer ÷ 6, 10) × dekkingspercentage
                    </>
                  ) : (
                    <>
                      Annual yield [kWh] = irradiance × system size [kWp] × 0.85<br />
                      System size = min(floor area ÷ 6, 10) × coverage %
                    </>
                  )}
                </Formula>
                <p className="text-xs text-stone-400 mt-1">{nl ? 'Bestraling van PVGIS (EU Commissie). Efficiëntie 0,85 verdisconteert inverter- en bekabelingsverliezen. Max. 10 kWp per woning.' : 'Irradiance from PVGIS (EU Commission). Efficiency 0.85 accounts for inverter and wiring losses. Capped at 10 kWp per home.'}</p>
              </div>

              <div>
                <p className="font-semibold text-stone-700 mb-1">{nl ? 'Warmtepomp (verwarming)' : 'Heat pump (heating)'}</p>
                <Formula>
                  {nl ? (
                    <>
                      Gas bespaard = 100% van huidig verbruik<br />
                      Extra elektriciteit = gas × 8,8 kWh/m³ ÷ COP<br />
                      COP lucht-water = 3,0 · COP bodem-water = 4,0
                    </>
                  ) : (
                    <>
                      Gas saved = 100% of current consumption<br />
                      Electricity added = gas × 8.8 kWh/m³ ÷ COP<br />
                      COP air-source = 3.0 · COP ground-source = 4.0
                    </>
                  )}
                </Formula>
              </div>

              <div>
                <p className="font-semibold text-stone-700 mb-1">{nl ? 'Warmtepompboiler (tapwater)' : 'Heat pump water heater'}</p>
                <Formula>
                  {nl ? (
                    <>
                      Tapwatergas = jaarverbruik × 20%<br />
                      Extra elektriciteit = tapwatergas × 8,8 ÷ 2,5 (COP)
                    </>
                  ) : (
                    <>
                      Hot water gas = annual consumption × 20%<br />
                      Electricity added = hot water gas × 8.8 ÷ 2.5 (COP)
                    </>
                  )}
                </Formula>
              </div>

              <div>
                <p className="font-semibold text-stone-700 mb-1">{nl ? 'Thuisbatterij' : 'Home battery'}</p>
                <Formula>
                  {nl ? (
                    <>
                      Jaarlijkse besparing = capaciteit × 300 cycli × 0,85 × (stroomprijs − €0,07)
                    </>
                  ) : (
                    <>
                      Annual saving = capacity × 300 cycles × 0.85 × (retail price − €0.07 feed-in)
                    </>
                  )}
                </Formula>
                <p className="text-xs text-stone-400 mt-1">{nl ? '300 cycli/jaar is een empirische schatting voor zomerbedrijf + gedeeltelijk wintergebruik. €0,07/kWh is de typische terugleververgoeding.' : '300 cycles/year is an empirical estimate for summer operation plus partial winter use. €0.07/kWh is the typical grid feed-in rate.'}</p>
              </div>
            </div>
          </AccordionSection>

          {/* Costs */}
          <AccordionSection title={nl ? 'Hoe we de kosten bepalen' : 'How we determine costs'}>
            <div className="space-y-3 text-sm text-stone-600">
              <p>
                {nl
                  ? 'De basiskosten komen van Milieu Centraal Verbetercheck (marktgemiddelden, bijgewerkt circa twee keer per jaar). Dit zijn indicatieve bandbreedtes — een daadwerkelijke offerte kan hoger of lager uitvallen afhankelijk van regio, installateur en specifieke woningkenmerken.'
                  : 'Base costs are sourced from Milieu Centraal Verbetercheck (market averages, updated ~twice per year). These are indicative ranges — an actual quote may be higher or lower depending on region, installer, and specific property characteristics.'}
              </p>
              <SectionLabel>{nl ? 'Niveaukosten' : 'Tier costs'}</SectionLabel>
              <p>
                {nl
                  ? 'Maatregelen met meerdere niveaus gebruiken een vermenigvuldiger op de basiskosten:'
                  : 'Upgrades with multiple tiers use a multiplier on the base cost:'}
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs text-stone-400 uppercase">
                    <th className="pb-1 pr-4">{nl ? 'Maatregel' : 'Upgrade'}</th>
                    <th className="pb-1 pr-4">{nl ? 'Niveau' : 'Tier'}</th>
                    <th className="pb-1">{nl ? 'Vermenigvuldiger' : 'Multiplier'}</th>
                  </tr>
                </thead>
                <tbody className="text-stone-600">
                  {[
                    [nl ? 'Dakisolatie' : 'Roof insulation', 'Rc 2,5 / 4,0 / 6,0', '0,6× / 1,0× / 1,4×'],
                    [nl ? 'Vloerisolatie' : 'Floor insulation', 'Rc 2,5 / 3,5', '0,7× / 1,0×'],
                    [nl ? 'Isolatieglas' : 'Glazing', 'HR++ / Vacuüm / Triple', '1,0× / 2,0× / 1,5×'],
                    [nl ? 'Zonnepanelen' : 'Solar panels', '50% / 75% / 100%', '0,5× / 0,75× / 1,0×'],
                    [nl ? 'Warmtepomp' : 'Heat pump', nl ? 'Lucht / Bodem' : 'Air / Ground', '1,0× / 2,0×'],
                    [nl ? 'Thuisbatterij' : 'Home battery', '5 / 10 / 15 kWh', '0,5× / 1,0× / 1,5×'],
                  ].map(([u, t, m]) => (
                    <tr key={u as string} className="border-t border-stone-100">
                      <td className="py-1.5 pr-4">{u}</td>
                      <td className="py-1.5 pr-4 text-stone-400">{t}</td>
                      <td className="py-1.5 font-mono text-xs">{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SectionLabel>{nl ? 'Subsidies' : 'Subsidies'}</SectionLabel>
              <p>
                {nl
                  ? 'Subsidies worden van de brutokost afgetrokken: nettokosten = max(0, bruto − subsidie). Bedragen zijn afkomstig van het ISDE-programma van RVO en worden bijgewerkt zodra de overheid wijzigingen aankondigt.'
                  : 'Subsidies are deducted from the gross cost: net cost = max(0, gross − subsidy). Amounts come from the RVO ISDE programme and are updated when the government announces changes.'}
              </p>
            </div>
          </AccordionSection>

          {/* Prices */}
          <AccordionSection title={nl ? 'Energieprijsscenario\'s' : 'Energy price scenarios'}>
            <div className="space-y-3 text-sm text-stone-600">
              <p>{nl ? 'Alle berekeningen zijn gevoelig voor energieprijzen. We bieden vier scenario\'s:' : 'All calculations are sensitive to energy prices. We offer four scenarios:'}</p>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    [nl ? 'Huidig' : 'Current', nl ? 'CBS-huishoudgemiddelden: gas €1,28/m³, stroom €0,32/kWh' : 'CBS household averages: gas €1.28/m³, electricity €0.32/kWh'],
                    [nl ? 'Piek 2022' : 'Peak 2022', nl ? 'Crisisniveau: gas €1,85/m³ — toont hoe goed isolatie loont bij hoge prijzen' : 'Crisis level: gas €1.85/m³ — shows how well insulation pays off at high prices'],
                    [nl ? 'Conservatief' : 'Conservative', nl ? '80% van het huidige tarief — houdt rekening met mogelijke prijsdaling' : '80% of current rate — accounts for possible price decreases'],
                    [nl ? 'Eigen contract' : 'Your contract', nl ? 'Jouw werkelijke tarieven als je die invult' : 'Your actual rates if you enter them'],
                  ].map(([s, d]) => (
                    <tr key={s as string} className="border-t border-stone-100">
                      <td className="py-1.5 pr-4 font-medium text-stone-700 align-top whitespace-nowrap">{s}</td>
                      <td className="py-1.5 text-stone-500">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionSection>

          {/* Financials */}
          <AccordionSection title={nl ? 'Financiële indicatoren' : 'Financial metrics'}>
            <div className="space-y-4 text-sm text-stone-600">
              <Formula>
                {nl ? (
                  <>
                    Jaarlijkse besparing = bespaard gas × gasprijs − extra stroom × stroomprijs<br />
                    Nettokosten = max(0, brutokosten − subsidie)<br />
                    Terugverdientijd = gemiddelde nettokosten ÷ jaarlijkse besparing<br />
                    Totaalrendement = jaarlijkse besparing × (levensduur − terugverdientijd)
                  </>
                ) : (
                  <>
                    Annual saving = saved gas × gas price − added electricity × electricity price<br />
                    Net cost = max(0, gross cost − subsidy)<br />
                    Payback = average net cost ÷ annual saving<br />
                    Total return = annual saving × (lifespan − payback years)
                  </>
                )}
              </Formula>
              <p className="text-xs text-stone-400">
                {nl
                  ? 'Terugverdientijd is gebaseerd op het gemiddelde van de kostenbandbandbreedte. De werkelijke terugverdientijd hangt af van de exacte installatieprijs.'
                  : 'Payback is based on the midpoint of the cost range. Actual payback depends on the exact installation price.'}
              </p>
            </div>
          </AccordionSection>

          {/* CO2 */}
          <AccordionSection title={nl ? 'CO₂-impact' : 'CO₂ impact'}>
            <div className="space-y-3 text-sm text-stone-600">
              <Formula>
                {nl ? (
                  <>
                    CO₂ gas [ton/jaar] = bespaard gas [m³] × 1,884 kg/m³ ÷ 1.000<br />
                    CO₂ stroom [ton/jaar] = bespaard stroom [kWh] × netfactor [kg/kWh] ÷ 1.000<br />
                    Equivalent bomen = CO₂ × 1.000 ÷ 21 kg/boom/jaar
                  </>
                ) : (
                  <>
                    CO₂ gas [tonnes/yr] = saved gas [m³] × 1.884 kg/m³ ÷ 1,000<br />
                    CO₂ electricity [tonnes/yr] = saved kWh × grid factor [kg/kWh] ÷ 1,000<br />
                    Tree equivalent = CO₂ × 1,000 ÷ 21 kg/tree/year
                  </>
                )}
              </Formula>
              <p>
                {nl
                  ? 'De CO₂-factor van elektriciteit daalt naarmate het stroomnet groener wordt. We gebruiken de CE Delft-prognose:'
                  : 'The electricity CO₂ factor declines as the grid decarbonises. We use the CE Delft projection:'}
              </p>
              <div className="flex gap-2 flex-wrap">
                {[['2025','0,45'],['2027','0,38'],['2030','0,28'],['2033','0,18'],['2035','0,10']].map(([y,v]) => (
                  <div key={y} className="bg-stone-100 rounded px-2 py-1 text-xs text-center">
                    <div className="font-medium">{y}</div>
                    <div className="text-stone-500">{v} kg/kWh</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400">
                {nl
                  ? 'Bomenequivalent is gebaseerd op de EPA-schatting van 21 kg CO₂ per boom per jaar.'
                  : 'Tree equivalent uses the EPA estimate of 21 kg CO₂ absorbed per tree per year.'}
              </p>
            </div>
          </AccordionSection>

        </div>

        {/* Assumptions — always visible */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-amber-800">
            {nl ? 'Aannames en beperkingen' : 'Assumptions & limitations'}
          </h2>
          <ul className="space-y-1.5 text-sm text-amber-700 list-disc list-inside">
            {(nl ? [
              'Oppervlakteverhoudingen (muur 80%, dak 70%, ramen 15%) zijn geometrische schattingen — niet gemeten.',
              'Procentuele besparingen voor tochtdichting (7%) en thermostaat (12%) zijn gemiddelden; werkelijke besparing verschilt per woning.',
              'Tapwateraandeel is vast op 20% van het totale gasverbruik.',
              'Graaddagen zijn regionaal, maar standaard op 2.750 als de regio niet beschikbaar is.',
              'Geen modellering van bezetting, gedrag of seizoensvariatie.',
              'Kosten zijn landelijke gemiddelden, geen installateursoffertes.',
              'EPC-labelsprong is een schatting — geen gecertificeerde beoordeling.',
            ] : [
              'Area ratios (wall 80%, roof 70%, windows 15%) are geometric estimates — not measured.',
              'Percentage savings for draught-proofing (7%) and thermostat (12%) are averages; actual savings vary by home.',
              'Hot water share is fixed at 20% of total gas consumption.',
              'Heating degree days are regional, defaulting to 2,750 when region is unavailable.',
              'No modelling of occupancy, behaviour, or seasonal variation.',
              'Costs are national averages, not installer quotes.',
              'EPC label improvement is an estimate — not a certified assessment.',
            ]).map(a => <li key={a}>{a}</li>)}
          </ul>
        </div>

        {/* Data sources table — always visible */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
          <h2 className="font-semibold text-stone-800">
            {nl ? 'Databronnen' : 'Data sources'}
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs text-stone-400 uppercase">
                <th className="pb-2 pr-4">{nl ? 'Bron' : 'Source'}</th>
                <th className="pb-2 pr-4">{nl ? 'Data' : 'Data'}</th>
                <th className="pb-2">{nl ? 'Frequentie' : 'Frequency'}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['BAG (Kadaster)', nl ? 'Adres, bouwjaar, oppervlak' : 'Address, year, area', nl ? 'Live API' : 'Live API', 'https://bag.basisregistraties.overheid.nl'],
                ['EP-Online (RVO)', nl ? 'Energielabel, EPC-data' : 'Energy label, EPC data', nl ? 'Live API' : 'Live API', 'https://www.ep-online.nl'],
                ['PVGIS (EU Commissie)', nl ? 'Zonnestraling' : 'Solar irradiance', nl ? 'Live API' : 'Live API', 'https://re.jrc.ec.europa.eu/pvg_tools'],
                ['NTA 8800 (RVO)', nl ? 'U-waarden referentie' : 'U-value reference', nl ? 'Statisch' : 'Static', 'https://www.rvo.nl/onderwerpen/wetten-en-regels-gebouwen/nta-8800'],
                ['CBS Statline', nl ? 'Energieprijzen' : 'Energy prices', nl ? 'Wekelijks cache' : 'Weekly cache', 'https://opendata.cbs.nl'],
                ['CE Delft', nl ? 'CO₂-factoren elektriciteit' : 'Electricity CO₂ factors', nl ? 'Jaarlijks' : 'Annual', 'https://www.ce.nl'],
                ['Milieu Centraal', nl ? 'Upgradekosten' : 'Upgrade costs', '~2×/jaar', 'https://www.milieucentraal.nl/energie-besparen/verbetercheck'],
                ['RVO ISDE', nl ? 'Subsidiebedragen' : 'Subsidy amounts', nl ? 'Bij aankondiging' : 'As announced', 'https://www.rvo.nl/subsidies-financiering/isde'],
              ].map(([src, data, freq, url]) => (
                <tr key={src as string} className="border-t border-stone-100">
                  <td className="py-2 pr-4 align-top">
                    <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline font-medium">{src}</a>
                  </td>
                  <td className="py-2 pr-4 text-stone-500 align-top">{data}</td>
                  <td className="py-2 text-stone-400 align-top whitespace-nowrap">{freq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  )
}
