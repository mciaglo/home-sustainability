'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/locale-context'
import LanguageToggle from '@/components/LanguageToggle'

function AccordionSection({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
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
    <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 font-mono text-sm text-stone-700 leading-relaxed overflow-x-auto">
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
              ? 'We bouwen een compleet energiemodel van jouw woning en berekenen besparingen als het verschil tussen vóór en ná een upgrade.'
              : 'We build a complete energy model of your home and calculate savings as the difference between before and after an upgrade.'}
          </p>
        </div>

        {/* Core approach — always visible */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-5">
          <h2 className="font-semibold text-stone-800">
            {nl ? 'Hoe het werkt' : 'How it works'}
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            {nl
              ? 'We bouwen een virtueel energiemodel van jouw woning: hoeveel warmte er weglekt door muren, dak, vloer en ramen, hoeveel gas en stroom er nodig is om dat verlies te compenseren, en wat dat kost. Vervolgens passen we een upgrade toe — beter glas, een warmtepomp, zonnepanelen — en berekenen dezelfde kosten opnieuw. Het verschil is je besparing.'
              : 'We build a virtual energy model of your home: how much heat leaks out through walls, roof, floor and windows, how much gas and electricity is needed to compensate, and what that costs. Then we apply an upgrade — better glazing, a heat pump, solar panels — and calculate the same costs again. The difference is your saving.'}
          </p>

          <div className="bg-stone-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-stone-700">
              {nl ? 'Waarom dit beter is dan losse schattingen' : 'Why this is better than isolated estimates'}
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              {nl
                ? 'Veel tools berekenen elke maatregel los: "een warmtepomp bespaart X per jaar." Maar in werkelijkheid beïnvloeden upgrades elkaar. Als je eerst je muren isoleert, heeft je woning minder warmte nodig — en bespaart een warmtepomp daarna minder dan verwacht, omdat er minder te besparen valt. Omgekeerd: in een goed geïsoleerd huis werkt een warmtepomp efficiënter. Door alles in één model te berekenen, pakken we deze wisselwerkingen automatisch mee.'
                : 'Many tools calculate each upgrade separately: "a heat pump saves X per year." But in reality, upgrades affect each other. If you insulate your walls first, your home needs less heat — so a heat pump added afterwards saves less than expected, because there\'s less to save. Conversely, in a well-insulated home a heat pump runs more efficiently. By calculating everything in one model, we capture these interactions automatically.'}
            </p>
          </div>

          <div className="bg-stone-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-stone-700">
              {nl ? 'Gekalibreerd op jouw woning' : 'Calibrated to your home'}
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              {nl
                ? 'Het model begint met het fysische warmteverlies op basis van bouwjaar en woningtype, maar corrigeert dit vervolgens met je werkelijke gasverbruik. Als je zuiniger stookt dan gemiddeld, past het model zich aan — zodat de besparingen kloppen met jouw situatie, niet met een theoretisch gemiddelde.'
                : 'The model starts with physics-based heat loss from your build year and building type, but then corrects this against your actual gas consumption. If you heat more conservatively than average, the model adjusts — so the savings match your situation, not a theoretical average.'}
            </p>
          </div>

          <div className="bg-stone-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-stone-700">
              {nl ? 'Gecombineerde plannen' : 'Combined plans'}
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              {nl
                ? 'Als je meerdere maatregelen selecteert, tellen we de losse besparingen niet bij elkaar op. In plaats daarvan berekenen we het hele model opnieuw met al je geselecteerde upgrades tegelijk. Zo kan de totale besparing nooit hoger zijn dan je werkelijke energierekening.'
                : 'When you select multiple upgrades, we don\'t add up individual savings. Instead, we recalculate the entire model with all your selected upgrades at once. This way, combined savings can never exceed your actual energy bill.'}
            </p>
          </div>
        </div>

        {/* 7-step model */}
        <div className="space-y-3">

          <AccordionSection title={nl ? 'Stap 1 — Hoe goed is je woning geïsoleerd?' : 'Step 1 — How well is your home insulated?'} defaultOpen>
            <p className="text-sm text-stone-600">
              {nl
                ? 'Elk bouwonderdeel — gevel, dak, vloer, ramen — laat warmte door. Hoe slechter de isolatie, hoe meer warmte er weglekt. We schatten de isolatiekwaliteit (U-waarde) op basis van wanneer je woning gebouwd is. Oudere woningen zijn slechter geïsoleerd dan nieuwe. Als je een officieel energielabel hebt, gebruiken we die gegevens in plaats van de schatting.'
                : 'Every part of your home — walls, roof, floor, windows — lets heat escape. The worse the insulation, the more heat leaks out. We estimate insulation quality (U-value) based on when your home was built. Older homes are worse insulated than newer ones. If you have an official energy label, we use that data instead of the estimate.'}
            </p>
            <SectionLabel>{nl ? 'U-waarden per bouwjaar' : 'U-values by build era'}</SectionLabel>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-stone-400 uppercase">
                  <th className="pb-1 pr-3">{nl ? 'Bouwjaar' : 'Era'}</th>
                  <th className="pb-1 pr-3">{nl ? 'Gevel' : 'Wall'}</th>
                  <th className="pb-1 pr-3">{nl ? 'Dak' : 'Roof'}</th>
                  <th className="pb-1 pr-3">{nl ? 'Vloer' : 'Floor'}</th>
                  <th className="pb-1">{nl ? 'Glas' : 'Glazing'}</th>
                </tr>
              </thead>
              <tbody className="text-stone-600 font-mono text-xs">
                {[
                  ['< 1945', '1.8', '2.0', '1.5', '5.8'],
                  ['1945–1974', '1.5', '1.8', '1.2', '5.8'],
                  ['1975–1991', '0.8', '0.5', '0.7', '2.9'],
                  ['1992–2005', '0.4', '0.4', '0.4', '2.9'],
                  ['2006–2014', '0.28', '0.25', '0.28', '1.2'],
                  ['2015+', '0.22', '0.20', '0.22', '0.7'],
                ].map(([era, w, r, f, g]) => (
                  <tr key={era} className="border-t border-stone-100">
                    <td className="py-1 pr-3 text-stone-700">{era}</td>
                    <td className="py-1 pr-3">{w}</td>
                    <td className="py-1 pr-3">{r}</td>
                    <td className="py-1 pr-3">{f}</td>
                    <td className="py-1">{g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-stone-400 mt-2">
              {nl ? 'Bron: NTA 8800-referentietabel (RVO). Waarden in W/m²K.' : 'Source: NTA 8800 reference table (RVO). Values in W/m²K.'}
            </p>

            <SectionLabel>{nl ? 'Oppervlakteverhoudingen per woningtype' : 'Area ratios by building type'}</SectionLabel>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-stone-400 uppercase">
                  <th className="pb-1 pr-3">{nl ? 'Type' : 'Type'}</th>
                  <th className="pb-1 pr-3">{nl ? 'Gevel' : 'Wall'}</th>
                  <th className="pb-1 pr-3">{nl ? 'Dak' : 'Roof'}</th>
                  <th className="pb-1">{nl ? 'Ramen' : 'Windows'}</th>
                </tr>
              </thead>
              <tbody className="text-stone-600 text-xs">
                {[
                  [nl ? 'Vrijstaand' : 'Detached', '100%', '80%', '18%'],
                  [nl ? 'Twee-onder-één-kap' : 'Semi-detached', '85%', '75%', '16%'],
                  [nl ? 'Hoekwoning' : 'Corner', '85%', '70%', '16%'],
                  [nl ? 'Rijtjeswoning' : 'Terraced', '60%', '70%', '15%'],
                  [nl ? 'Appartement' : 'Apartment', '40%', '30%', '12%'],
                ].map(([type, w, r, win]) => (
                  <tr key={type} className="border-t border-stone-100">
                    <td className="py-1 pr-3 text-stone-700">{type}</td>
                    <td className="py-1 pr-3">{w}</td>
                    <td className="py-1 pr-3">{r}</td>
                    <td className="py-1">{win}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-stone-400 mt-1">
              {nl ? 'Percentages van het totale vloeroppervlak. Vloer = begane grond (vloeroppervlak ÷ verdiepingen).' : 'Percentages of total floor area. Floor = ground floor (floor area ÷ stories).'}
            </p>
          </AccordionSection>

          <AccordionSection title={nl ? 'Stap 2 — Hoeveel warmte lekt er weg?' : 'Step 2 — How much heat escapes?'}>
            <p className="text-sm text-stone-600">
              {nl
                ? 'Voor elk bouwonderdeel berekenen we hoeveel warmte er per jaar doorheen lekt: isolatiekwaliteit × oppervlak × het verschil tussen binnen- en buitentemperatuur (uitgedrukt in graaddagen). Warmte verdwijnt ook via ventilatie — door kieren, roosters en open ramen. De formule volgt de NTA 8800, de officiële Nederlandse berekenmethode:'
                : 'For each building element, we calculate how much heat escapes per year: insulation quality × surface area × the temperature difference between inside and outside (expressed as heating degree days). Heat also escapes through ventilation — gaps, vents, and open windows. The formula follows NTA 8800, the official Dutch calculation method:'}
            </p>
            <Formula>
              {nl ? (
                <>
                  gevelverlies  = U_gevel × gevelopp. × HDD × 24 ÷ 1.000<br />
                  dakverlies    = U_dak × dakopp. × HDD × 24 ÷ 1.000<br />
                  vloerverlies  = U_vloer × vloeropp. × HDD × 24 ÷ 1.000<br />
                  glasverlies   = U_glas × raamopp. × HDD × 24 ÷ 1.000<br />
                  ventilatieverlies = 0,335 × ACH × volume × HDD × 24 ÷ 1.000<br /><br />
                  totale warmtevraag = som van alle verliezen [kWh/jaar]
                </>
              ) : (
                <>
                  wallLoss    = U_wall × wallArea × HDD × 24 ÷ 1,000<br />
                  roofLoss    = U_roof × roofArea × HDD × 24 ÷ 1,000<br />
                  floorLoss   = U_floor × floorArea × HDD × 24 ÷ 1,000<br />
                  glazingLoss = U_glazing × windowArea × HDD × 24 ÷ 1,000<br />
                  ventLoss    = 0.335 × ACH × volume × HDD × 24 ÷ 1,000<br /><br />
                  totalHeatingDemand = sum of all losses [kWh/yr]
                </>
              )}
            </Formula>
            <SectionLabel>{nl ? 'Ventilatieverlies' : 'Ventilation loss'}</SectionLabel>
            <p className="text-sm text-stone-600">
              {nl
                ? '0,335 = luchtdichtheid (1,2 kg/m³) × soortelijke warmte (0,279 Wh/kg·K). ACH (luchtwisselingen per uur) is afhankelijk van het bouwjaar:'
                : '0.335 = air density (1.2 kg/m³) × specific heat (0.279 Wh/kg·K). ACH (air changes per hour) depends on build era:'}
            </p>
            <div className="flex gap-2 flex-wrap mt-2">
              {[['< 1945','1.2'],['1945–74','1.0'],['1975–91','0.8'],['1992–05','0.6'],['2006–14','0.4'],['2015+','0.3']].map(([era,ach]) => (
                <div key={era} className="bg-stone-100 rounded px-2.5 py-1 text-xs text-center">
                  <div className="font-medium text-stone-700">{era}</div>
                  <div className="text-stone-500">{ach} ACH</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-2">
              {nl
                ? 'Tochtdichting verlaagt ACH met 0,25. MVHR (mechanische ventilatie met warmteterugwinning) wint 80% van het ventilatieverlies terug.'
                : 'Draught-proofing reduces ACH by 0.25. MVHR (mechanical ventilation with heat recovery) recovers 80% of ventilation heat loss.'}
            </p>
          </AccordionSection>

          <AccordionSection title={nl ? 'Stap 3 — Klopt het model met je werkelijke verbruik?' : 'Step 3 — Does the model match your actual usage?'}>
            <p className="text-sm text-stone-600">
              {nl
                ? 'De berekening uit stap 2 geeft een theoretisch warmteverlies. In de praktijk stookt iedereen anders: je zet misschien de verwarming lager, of je huis krijgt meer zon dan gemiddeld. Daarom vergelijken we de theorie met je echte gasverbruik. We nemen aan dat ~80% van je gas naar verwarming gaat en ~20% naar warm water (douche, keuken). De verhouding tussen het berekende en werkelijke gasverbruik geeft een correctiefactor:'
                : 'The calculation from step 2 gives a theoretical heat loss. In practice, everyone heats differently: you might keep the thermostat lower, or your home gets more sun than average. So we compare the theory with your real gas usage. We assume ~80% of your gas goes to heating and ~20% to hot water (shower, kitchen). The ratio between calculated and actual gas use gives us a correction factor:'}
            </p>
            <Formula>
              {nl ? (
                <>
                  verwarmingsgas = jaarverbruik × 80%<br />
                  tapwatergas = jaarverbruik × 20%<br /><br />
                  werkelijkVerbruikKwh = verwarmingsgas × 8,8 × 0,92<br />
                  gratiswarmte = theoretischeVraag − werkelijkVerbruikKwh<br /><br />
                  gecorrigeerdeVraag = max(0, geüpgradeVraag − gratiswarmte)
                </>
              ) : (
                <>
                  heatingGas = annualGas × 80%<br />
                  hotWaterGas = annualGas × 20%<br /><br />
                  actualHeatingKwh = heatingGas × 8.8 × 0.92<br />
                  freeHeat = theoreticalDemand − actualHeatingKwh<br /><br />
                  adjustedDemand = max(0, upgradedDemand − freeHeat)
                </>
              )}
            </Formula>
            <p className="text-sm text-stone-600 mt-2">
              {nl
                ? 'De "gratis warmte" — zonnewarmte door de ramen, warmte van apparaten en bewoners — is bij benadering constant, ongeacht je isolatie. Door dezelfde absolute hoeveelheid gratis warmte af te trekken van zowel de huidige als de geüpgrade situatie, voorkomt het model dat isolatiebesparingen worden overschat.'
                : 'The "free heat" — solar warmth through windows, heat from appliances and occupants — is roughly constant regardless of your insulation. By subtracting the same absolute amount of free heat from both the current and upgraded scenarios, the model avoids overstating insulation savings.'}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {nl ? '0,92 = rendement van een HR-ketel. 8,8 kWh/m³ = energieinhoud van aardgas.' : '0.92 = condensing boiler efficiency. 8.8 kWh/m³ = energy content of natural gas.'}
            </p>
          </AccordionSection>

          <AccordionSection title={nl ? 'Stap 4 — Hoe wordt je woning verwarmd?' : 'Step 4 — How is your home heated?'}>
            <p className="text-sm text-stone-600">
              {nl
                ? 'Nu weten we hoeveel warmte je woning nodig heeft. De volgende vraag is: waar komt die warmte vandaan? We modelleren drie verwarmingssystemen:'
                : 'Now we know how much heat your home needs. The next question is: where does that heat come from? We model three heating systems:'}
            </p>
            <Formula>
              {nl ? (
                <>
                  <strong>CV-ketel:</strong> gas = warmtevraag ÷ (8,8 × 0,92)<br /><br />
                  <strong>Volledig elektrische warmtepomp:</strong><br />
                  stroom = warmtevraag ÷ COP, gas = 0<br />
                  tapwater ook via warmtepomp (COP 2,5)<br /><br />
                  <strong>Hybride warmtepomp:</strong><br />
                  ~60% van de warmtevraag via warmtepomp (stroom)<br />
                  ~40% via gasketel (kou, piekbelasting)<br />
                  tapwater via gasketel<br /><br />
                  <strong>Slimme thermostaat:</strong><br />
                  gasketel: −10% | hybride: −13% | warmtepomp: −15%
                </>
              ) : (
                <>
                  <strong>Gas boiler:</strong> gas = demand ÷ (8.8 × 0.92)<br /><br />
                  <strong>Full electric heat pump:</strong><br />
                  electricity = demand ÷ COP, gas = 0<br />
                  hot water also via heat pump (COP 2.5)<br /><br />
                  <strong>Hybrid heat pump:</strong><br />
                  ~60% of demand via heat pump (electricity)<br />
                  ~40% via gas boiler (cold days, peak load)<br />
                  hot water via gas boiler<br /><br />
                  <strong>Smart thermostat:</strong><br />
                  gas boiler: −10% | hybrid: −13% | heat pump: −15%
                </>
              )}
            </Formula>
            <p className="text-sm text-stone-600 mt-3">
              {nl
                ? 'Een hybride warmtepomp is de meest populaire optie in Nederland: goedkoper dan een volledig elektrische warmtepomp, werkt met je bestaande radiatoren, en reduceert ~50-60% van je gasverbruik voor verwarming. Bij mild weer (boven ~3-5°C) verwarmt de warmtepomp; bij kou schakelt de gasketel bij.'
                : 'A hybrid heat pump is the most popular option in the Netherlands: cheaper than a full electric heat pump, works with your existing radiators, and reduces ~50-60% of your gas consumption for heating. In mild weather (above ~3-5°C) the heat pump heats; in cold weather the gas boiler takes over.'}
            </p>
            <SectionLabel>{nl ? 'Warmtepomprendement (COP)' : 'Heat pump efficiency (COP)'}</SectionLabel>
            <p className="text-sm text-stone-600">
              {nl
                ? 'De COP geeft aan hoeveel warmte een warmtepomp levert per eenheid stroom. Een COP van 3 = 1 kWh stroom levert 3 kWh warmte. In een goed geïsoleerd huis is de COP hoger (lagere aanvoertemperatuur). Als je tegelijk isoleert en een warmtepomp installeert, gebruiken we het verbeterde isolatieniveau voor de COP-berekening.'
                : 'COP tells you how much heat a heat pump delivers per unit of electricity. A COP of 3 = 1 kWh of electricity produces 3 kWh of heat. In a well-insulated home the COP is higher (lower supply temperature). If you install insulation and a heat pump together, we use the improved insulation level for the COP calculation.'}
            </p>
            <div className="overflow-x-auto mt-2">
              <table className="text-xs border-collapse">
                <thead>
                  <tr className="text-stone-400 uppercase">
                    <th className="pb-1 pr-3 text-left">{nl ? 'Label' : 'Label'}</th>
                    <th className="pb-1 pr-3">{nl ? 'Lucht-water' : 'Air-source'}</th>
                    <th className="pb-1 pr-3">{nl ? 'Hybride' : 'Hybrid'}</th>
                    <th className="pb-1">{nl ? 'Bodem-water' : 'Ground-source'}</th>
                  </tr>
                </thead>
                <tbody className="text-stone-600">
                  {[['G','2.2','2.4','3.2'],['E','2.6','2.8','3.6'],['C','3.0','3.2','4.0'],['A','3.5','3.7','4.5'],['A++','4.0','4.1','5.0']].map(([l,a,h,g]) => (
                    <tr key={l} className="border-t border-stone-100">
                      <td className="py-1 pr-3 font-medium text-stone-700">{l}</td>
                      <td className="py-1 pr-3 text-center">{a}</td>
                      <td className="py-1 pr-3 text-center">{h}</td>
                      <td className="py-1 text-center">{g}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              {nl ? 'Seizoensgemiddelden (SCOP). COP tapwaterboiler: 2,5.' : 'Seasonal averages (SCOP). Hot water heat pump COP: 2.5.'}
            </p>
          </AccordionSection>

          <AccordionSection title={nl ? 'Stap 5 — Zonnepanelen en stroomverbruik' : 'Step 5 — Solar panels and electricity'}>
            <p className="text-sm text-stone-600 mb-3">
              {nl
                ? 'We tellen al het stroomverbruik op: huishoudelijke apparaten + verwarming (als je een warmtepomp hebt) + warm water. Als je zonnepanelen hebt of overweegt, berekenen we hoeveel ze opwekken op basis van je locatie en dakoriëntatie (PVGIS-gegevens). Niet alle stroom kun je direct gebruiken — overdag opgewekte stroom terwijl je op werk bent gaat het net op. Een thuisbatterij verschuift die stroom naar de avond.'
                : 'We add up all electricity use: household appliances + heating (if you have a heat pump) + hot water. If you have or are considering solar panels, we calculate their output based on your location and roof orientation (PVGIS data). You can\'t use all the electricity directly — power generated during the day while you\'re at work goes to the grid. A home battery shifts that power to the evening.'}
            </p>
            <Formula>
              {nl ? (
                <>
                  totaleStroomvraag = apparaten + verwarmingsstroom + tapwaterstroom<br /><br />
                  zonneopwek = bestralingssterkte × kWp × 0,85<br />
                  eigenverbruik = opwek × 35% (zonder batterij)<br />
                  met batterij: eigenverbruik = min(85%, 35% + batteryShift)<br /><br />
                  netstroom = totaleStroomvraag − eigenverbruik<br />
                  teruglevering = opwek − eigenverbruik
                </>
              ) : (
                <>
                  totalDemand = appliances + heatingElec + hotWaterElec<br /><br />
                  solarProduction = irradiance × kWp × 0.85<br />
                  selfConsumed = production × 35% (without battery)<br />
                  with battery: selfConsumed = min(85%, 35% + batteryShift)<br /><br />
                  gridElectricity = totalDemand − selfConsumed<br />
                  exported = production − selfConsumed
                </>
              )}
            </Formula>
            <p className="text-xs text-stone-400 mt-2">
              {nl
                ? 'Zonder batterij gebruik je typisch ~35% van je zonnestroom zelf — de rest gaat het net op. Met een batterij kan dit oplopen tot ~85%. Zonne-irradiantie van PVGIS (EU Commissie). De factor 0,85 houdt rekening met verliezen in omvormer en kabels.'
                : 'Without a battery, you typically use ~35% of your solar power yourself — the rest goes to the grid. With a battery this can rise to ~85%. Solar irradiance from PVGIS (EU Commission). The 0.85 factor accounts for inverter and cable losses.'}
            </p>
          </AccordionSection>

          <AccordionSection title={nl ? 'Stap 6 — Wat kost het en wat bespaar je?' : 'Step 6 — What does it cost and what do you save?'}>
            <p className="text-sm text-stone-600 mb-3">
              {nl
                ? 'We tellen alles op tot een jaarlijkse energierekening: gasverbruik × gasprijs + netstroom × stroomprijs − teruggeleverde stroom × terugleververgoeding. Voor CO₂ rekenen we gas en netstroom apart om.'
                : 'We add everything up to an annual energy bill: gas consumption × gas price + grid electricity × electricity price − exported power × feed-in rate. For CO₂, we convert gas and grid electricity separately.'}
            </p>
            <Formula>
              {nl ? (
                <>
                  totaalGas = verwarmingsgas + tapwatergas<br />
                  totaleKosten = gas × gasprijs + netstroom × stroomprijs − teruglevering × €0,11<br />
                  totaalCO₂ = gas × 1,884 kg/m³ + netstroom × CO₂-netfactor
                </>
              ) : (
                <>
                  totalGas = heatingGas + hotWaterGas<br />
                  totalCost = gas × gasPrice + gridElec × elecPrice − exported × €0.11<br />
                  totalCO₂ = gas × 1.884 kg/m³ + gridElec × gridCO₂factor
                </>
              )}
            </Formula>
            <p className="text-sm text-stone-600 mt-2">
              {nl
                ? 'We berekenen dit model twee keer: één keer zonder upgrade, één keer met. Het verschil is je besparing. Selecteer je meerdere maatregelen, dan berekenen we het model met alles tegelijk — zo telt de besparing nooit hoger op dan je werkelijke energierekening.'
                : 'We run this model twice: once without the upgrade, once with. The difference is your saving. When you select multiple upgrades, we run the model with everything at once — so savings never add up to more than your actual energy bill.'}
            </p>
          </AccordionSection>

          {/* Costs */}
          <AccordionSection title={nl ? 'Kosten en subsidies' : 'Costs and subsidies'}>
            <div className="space-y-3 text-sm text-stone-600">
              <p>
                {nl
                  ? 'Basiskosten komen van Milieu Centraal Verbetercheck (marktgemiddelden). Isolatiekosten schalen mee met het oppervlak van je woning (referentie: 100 m², factor 0,5×–3,0×).'
                  : 'Base costs come from Milieu Centraal Verbetercheck (market averages). Insulation costs scale with your home\'s area (reference: 100 m², factor 0.5×–3.0×).'}
              </p>
              <Formula>
                {nl ? (
                  <>
                    nettoKosten = max(0, brutoKosten − subsidie)<br />
                    terugverdientijd = gemiddelde nettoKosten ÷ jaarlijkse besparing<br />
                    totaalRendement = jaarlijkse besparing × (levensduur − terugverdientijd)
                  </>
                ) : (
                  <>
                    netCost = max(0, grossCost − subsidy)<br />
                    payback = average netCost ÷ annual saving<br />
                    totalReturn = annual saving × (lifespan − payback years)
                  </>
                )}
              </Formula>
              <p className="text-sm text-stone-600">
                {nl
                  ? 'Als je meerdere maatregelen tegelijk uitvoert, zoals dak + gevel via een steiger, passen we kortingen toe (10-15% op installatiekosten). ISDE-subsidies worden per maatregel berekend, met controle op minimale Rc-waarde en bouwjaar.'
                  : 'When you combine upgrades, such as roof + wall via scaffolding, we apply discounts (10-15% on installation costs). ISDE subsidies are calculated per upgrade, with checks on minimum Rc value and build year.'}
              </p>
              <p className="text-xs text-stone-400">
                {nl
                  ? 'Subsidiebedragen: ISDE 2026 (RVO). Warmtepomp: €1.025 + €225/kW + €200 A+++ bonus.'
                  : 'Subsidy amounts: ISDE 2026 (RVO). Heat pump: €1,025 + €225/kW + €200 A+++ bonus.'}
              </p>
            </div>
          </AccordionSection>

          {/* CO2 */}
          <AccordionSection title={nl ? 'CO₂-impact' : 'CO₂ impact'}>
            <div className="space-y-3 text-sm text-stone-600">
              <Formula>
                {nl ? (
                  <>
                    CO₂ gas = m³ × 1,884 kg/m³<br />
                    CO₂ stroom = kWh × netfactor kg/kWh<br />
                    Bomenequivalent = CO₂ [kg] ÷ 21 kg/boom/jaar
                  </>
                ) : (
                  <>
                    CO₂ gas = m³ × 1.884 kg/m³<br />
                    CO₂ electricity = kWh × grid factor kg/kWh<br />
                    Tree equivalent = CO₂ [kg] ÷ 21 kg/tree/yr
                  </>
                )}
              </Formula>
              <p>{nl ? 'De CO₂-factor van elektriciteit daalt naarmate het net groener wordt:' : 'The electricity CO₂ factor declines as the grid decarbonises:'}</p>
              <div className="flex gap-2 flex-wrap">
                {[['2025','0.45'],['2027','0.38'],['2030','0.28'],['2033','0.18'],['2035','0.10']].map(([y,v]) => (
                  <div key={y} className="bg-stone-100 rounded px-2.5 py-1 text-xs text-center">
                    <div className="font-medium text-stone-700">{y}</div>
                    <div className="text-stone-500">{v} kg/kWh</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400">{nl ? 'Bron: CE Delft prognose. Bomenequivalent: EPA-schatting.' : 'Source: CE Delft projection. Tree equivalent: EPA estimate.'}</p>
            </div>
          </AccordionSection>

          {/* Energy prices */}
          <AccordionSection title={nl ? 'Energieprijsscenario\'s' : 'Energy price scenarios'}>
            <div className="space-y-3 text-sm text-stone-600">
              <p>{nl ? 'Alle berekeningen zijn gevoelig voor energieprijzen. We bieden vier scenario\'s:' : 'All calculations are sensitive to energy prices. We offer four scenarios:'}</p>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    [nl ? 'Huidig' : 'Current', nl ? 'CBS-gemiddelden: gas €1,28/m³, stroom €0,32/kWh' : 'CBS averages: gas €1.28/m³, electricity €0.32/kWh'],
                    [nl ? 'Piek 2022' : 'Peak 2022', nl ? 'Crisisniveau: gas €1,85/m³ — toont rendement bij hoge prijzen' : 'Crisis level: gas €1.85/m³ — shows payoff at high prices'],
                    [nl ? 'Conservatief' : 'Conservative', nl ? '80% van huidig — houdt rekening met mogelijke prijsdaling' : '80% of current — accounts for possible price decrease'],
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

        </div>

        {/* Housing restrictions */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
          <h2 className="font-semibold text-stone-800">
            {nl ? 'Woningtypebeperkingen' : 'Housing type restrictions'}
          </h2>
          <p className="text-sm text-stone-600">
            {nl
              ? 'Niet elke maatregel is geschikt voor elk woningtype. We controleren automatisch op bekende beperkingen en tonen waarschuwingen of blokkades.'
              : 'Not every upgrade suits every home type. We automatically check for known restrictions and show warnings or blocks.'}
          </p>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {(nl ? [
                ['Spouwmuurisolatie', 'Geblokkeerd voor woningen van voor 1920 (massieve muren zonder spouw)'],
                ['Buitengevelisolatie', 'Alleen voor- en achtergevel bij rijtjeswoningen (gedeelde muren). Niet bij monumenten.'],
                ['Vloerisolatie', 'Waarschuwing voor appartementen (vaak geen kruipruimte)'],
                ['Bodem-warmtepomp', 'Niet mogelijk bij appartementen. Waarschuwing bij rijtjeswoningen (kleine tuin).'],
                ['Lucht-warmtepomp', 'Waarschuwing bij rijtjeswoningen/appartementen (geluid: max 40 dB op erfgrens)'],
                ['Zonnepanelen', 'VvE-goedkeuring nodig bij appartementen. Vergunning bij monumenten.'],
                ['Balansventilatie', 'Waarschuwing bij woningen van voor 1975 (kanaalwerk lastig)'],
              ] : [
                ['Cavity wall insulation', 'Blocked for pre-1920 homes (solid walls without cavity)'],
                ['External wall insulation', 'Front/rear only for terraced houses (shared walls). Not on listed buildings.'],
                ['Floor insulation', 'Warning for apartments (usually no crawl space)'],
                ['Ground-source heat pump', 'Not possible for apartments. Warning for terraced (small garden).'],
                ['Air-source heat pump', 'Warning for terraced/apartments (noise: max 40 dB at property boundary)'],
                ['Solar panels', 'VvE approval needed for apartments. Permit for listed buildings.'],
                ['MVHR', 'Warning for pre-1975 homes (ductwork difficult)'],
              ]).map(([u, d]) => (
                <tr key={u} className="border-t border-stone-100">
                  <td className="py-1.5 pr-4 font-medium text-stone-700 align-top whitespace-nowrap">{u}</td>
                  <td className="py-1.5 text-stone-500">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assumptions */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-amber-800">
            {nl ? 'Aannames en beperkingen' : 'Assumptions & limitations'}
          </h2>
          <ul className="space-y-1.5 text-sm text-amber-700 list-disc list-inside">
            {(nl ? [
              'Oppervlakteverhoudingen zijn geometrische schattingen per woningtype — niet gemeten.',
              'Correctie via "gratis warmte" is een benadering — bij zeer goed geïsoleerde woningen neemt de nauwkeurigheid af.',
              'Tapwateraandeel is vast op 20% van het totale gasverbruik.',
              'Graaddagen zijn regionaal, standaard op 2.800 als de regio niet beschikbaar is.',
              'Hybride warmtepomp: 60/40 verdeling (warmtepomp/ketel) is een jaargemiddelde.',
              'COP-waarden zijn seizoensgemiddelden, niet momentwaarden.',
              'Kosten zijn landelijke gemiddelden — een daadwerkelijke offerte kan afwijken.',
              'EPC-labelsprong is een schatting — geen gecertificeerde beoordeling.',
            ] : [
              'Area ratios are geometric estimates per building type — not measured.',
              'Free heat correction is an approximation — accuracy decreases for very well-insulated homes.',
              'Hot water share is fixed at 20% of total gas consumption.',
              'Heating degree days are regional, defaulting to 2,800 when unavailable.',
              'Hybrid heat pump: 60/40 split (heat pump/boiler) is an annual average.',
              'COP values are seasonal averages, not instantaneous readings.',
              'Costs are national averages — an actual quote may differ.',
              'EPC label improvement is an estimate — not a certified assessment.',
            ]).map(a => <li key={a}>{a}</li>)}
          </ul>
        </div>

        {/* Data sources */}
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
                ['NTA 8800 (RVO)', nl ? 'U-waarden, ACH referentie' : 'U-values, ACH reference', nl ? 'Statisch' : 'Static', 'https://www.rvo.nl/onderwerpen/wetten-en-regels-gebouwen/nta-8800'],
                ['BAG (Kadaster)', nl ? 'Adres, bouwjaar, oppervlak, type' : 'Address, year, area, type', nl ? 'Live API' : 'Live API', 'https://bag.basisregistraties.overheid.nl'],
                ['EP-Online (RVO)', nl ? 'Energielabel, EPC-data' : 'Energy label, EPC data', nl ? 'Live API' : 'Live API', 'https://www.ep-online.nl'],
                ['PVGIS (EU)', nl ? 'Zonnestraling per locatie' : 'Solar irradiance by location', nl ? 'Live API' : 'Live API', 'https://re.jrc.ec.europa.eu/pvg_tools'],
                ['CBS Statline', nl ? 'Energieprijzen huishoudens' : 'Household energy prices', nl ? 'Wekelijks' : 'Weekly', 'https://opendata.cbs.nl'],
                ['CE Delft', nl ? 'CO₂-emissiefactoren stroom' : 'Electricity CO₂ factors', nl ? 'Jaarlijks' : 'Annual', 'https://www.ce.nl'],
                ['Milieu Centraal', nl ? 'Upgradekosten marktgemiddelden' : 'Upgrade cost averages', '~2×/' + (nl ? 'jaar' : 'yr'), 'https://www.milieucentraal.nl/energie-besparen/verbetercheck'],
                ['RVO ISDE', nl ? 'Subsidiebedragen' : 'Subsidy amounts', nl ? 'Bij aankondiging' : 'As announced', 'https://www.rvo.nl/subsidies-financiering/isde'],
                ['KNMI', nl ? 'Graaddagen per regio' : 'Heating degree days by region', nl ? 'Jaarlijks' : 'Annual', 'https://www.knmi.nl'],
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

        {/* Confidence */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
          <h2 className="font-semibold text-stone-800">
            {nl ? 'Betrouwbaarheid van je gegevens' : 'Data confidence'}
          </h2>
          <p className="text-sm text-stone-600">
            {nl
              ? 'De nauwkeurigheid van het model hangt af van de kwaliteit van de invoer. We gebruiken drie niveaus:'
              : 'Model accuracy depends on input quality. We use three confidence levels:'}
          </p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex gap-2">
              <span className="font-medium text-emerald-700 flex-shrink-0">1.</span>
              <span>
                <strong>{nl ? 'Geregistreerde EPC (EP-Online)' : 'Registered EPC (EP-Online)'}</strong>
                {' — '}{nl ? 'Officieel energielabel met gemeten U-waarden.' : 'Official energy label with measured U-values.'}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-amber-600 flex-shrink-0">2.</span>
              <span>
                <strong>{nl ? 'Bouwjaarschatting' : 'Build-era estimate'}</strong>
                {' — '}{nl ? 'Isolatieniveaus geschat op basis van bouwjaar via NTA 8800.' : 'Insulation estimated from construction year using NTA 8800.'}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-blue-600 flex-shrink-0">3.</span>
              <span>
                <strong>{nl ? 'Eigen energierekening' : 'Your energy bill'}</strong>
                {' — '}{nl ? 'Werkelijk verbruik vervangt schattingen en verbetert de normalisatiefactor.' : 'Actual consumption replaces estimates and improves the normalization factor.'}
              </span>
            </li>
          </ul>
          <p className="text-xs text-stone-400">
            {nl ? 'Elk upgradekaartje toont welke bron is gebruikt.' : 'Each upgrade card shows which source was used.'}
          </p>
        </div>

      </div>
    </main>
  )
}
