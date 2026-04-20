export type Locale = 'nl' | 'en'

export const defaultLocale: Locale = 'nl'

export const translations = {
  nl: {
    // Landing page
    'landing.title': 'Wat levert verduurzaming jouw woning op?',
    'landing.subtitle': 'Voer je adres in en ontdek welke maatregelen het meest opleveren — eerlijk, onafhankelijk en zonder verborgen agenda.',
    'landing.addressPlaceholder': 'Postcode of adres...',
    'landing.cta': 'Bekijk mijn woning',
    'landing.privacy': 'We slaan geen persoonlijke gegevens op. Alle berekeningen zijn gebaseerd op openbare bronnen.',
    'landing.loading.bag': 'Woninggegevens ophalen...',
    'landing.loading.energy': 'Energielabel opzoeken...',
    'landing.loading.solar': 'Zonnepotentieel berekenen...',
    'landing.loading.neighbourhood': 'Buurtdata laden...',

    // Profile
    'profile.title': 'Klopt dit?',
    'profile.subtitle': 'We hebben je woningprofiel opgesteld op basis van openbare data. Pas aan wat niet klopt.',
    'profile.yearBuilt': 'Bouwjaar',
    'profile.floorArea': 'Woonoppervlak',
    'profile.buildingType': 'Woningtype',
    'profile.energyLabel': 'Energielabel',
    'profile.heating': 'Verwarming',
    'profile.insulation': 'Isolatie',
    'profile.uploadBill': 'Energierekening uploaden voor nauwkeurigere berekeningen',
    'profile.uploadBillHint': 'Optioneel — we slaan niets op',
    'profile.confirm': 'Dit klopt, toon mijn resultaten',
    'profile.monument': 'Rijksmonument',
    'profile.monumentTooltip': 'Sommige ingrepen aan de buitenkant vereisen een vergunning — neem contact op met de gemeente.',
    'profile.vve': 'VvE-woning',
    'profile.vveNote': 'Overleg met je VvE voordat je externe aanpassingen doet.',

    // Results
    'results.sortBy': 'Sorteren op',
    'results.sortSavings': 'Jaarlijkse besparing',
    'results.sortRoi': 'Terugverdientijd',
    'results.sortCo2': 'CO₂-reductie',
    'results.sortIndependence': 'Energieonafhankelijkheid',
    'results.summary.maxSavings': 'Max. jaarlijkse besparing',
    'results.summary.bestPayback': 'Beste terugverdientijd',
    'results.summary.co2': 'CO₂ te reduceren',
    'results.summary.subsidies': 'Subsidies beschikbaar',
    'results.neighbourContext': 'Woningen in jouw postcode hebben gemiddeld label {label} — jij hebt label {yourLabel}',
    'results.priceScenario.current': 'Huidige tarieven',
    'results.priceScenario.peak2022': 'Piek 2022',
    'results.priceScenario.conservative': 'Conservatief',
    'results.priceScenario.contract': 'Huidig contract',
    'results.priceScenarioLabel': 'Bereken met',
    'results.card.perMonth': '/maand',
    'results.card.perYear': '/jaar',
    'results.card.payback': 'Terugverdientijd',
    'results.card.paidOff': 'Terugverdiend',
    'results.card.freeSavings': 'jaar gratis besparing',
    'results.card.totalReturn': '~€{amount} totaal rendement t/m {year}',
    'results.card.co2': 'CO₂-reductie',
    'results.card.co2Driving': '= {km} km minder rijden/jaar',
    'results.card.independence': 'Energieonafhankelijkheid',
    'results.card.gasReduction': '% minder gas',
    'results.card.solarProduction': '% zelf opgewekt',
    'results.card.askClaude': 'Vraag Claude ↗',
    'results.card.findInstallers': 'Installateurs vinden ↗',
    'results.card.applySubsidy': 'Subsidie aanvragen ↗',
    'results.card.subsidyDeadline': 'Budget loopt meestal op in {deadline}',
    'results.card.gridCongestion': 'Let op: dit postcodegebied heeft netcongestie — aansluiting van een warmtepomp kan vertraging oplopen.',
    'results.card.vveBlocked': 'Niet mogelijk zonder VvE-goedkeuring',
    'results.card.requiresBefore': 'Minder effectief zonder {upgrade} — overweeg dit eerst.',
    'results.card.benefitsFrom': 'Combineer met {upgrade} voor ~{saving} besparing op installatiekosten.',
    'results.card.costReality': 'Mensen verwachten vaak €{expected} — werkelijke kosten zijn gemiddeld €{actual}',
    'results.card.propertyValue': 'Upgrade van label {from} naar {to} voegt gemiddeld €{min}–{max} toe aan de woningwaarde.',
    'results.card.confidenceEpc': 'Op basis van jouw geregistreerde EPC-data',
    'results.card.confidenceEra': 'Geschat op basis van het bouwjaar van jouw woning',
    'results.card.confidenceBill': 'Op basis van jouw werkelijke energierekening',

    // Tags
    'tag.top-pick': 'Topaanbeveling',
    'tag.quick-win': 'Snel rendement',
    'tag.strong': 'Goed rendement',
    'tag.high-impact': 'Grote impact',
    'tag.long-game': 'Lange termijn',
    'tag.comfort-boost': 'Meer comfort',

    // Building types
    'buildingType.terraced': 'Tussenwoning',
    'buildingType.semi-detached': '2-onder-1-kapwoning',
    'buildingType.detached': 'Vrijstaande woning',
    'buildingType.apartment': 'Appartement',
    'buildingType.corner': 'Hoekwoning',

    // Heating types
    'heatingType.gas-boiler': 'CV-ketel (gas)',
    'heatingType.heat-pump-air': 'Lucht-water warmtepomp',
    'heatingType.heat-pump-ground': 'Bodem-water warmtepomp',
    'heatingType.district-heating': 'Stadsverwarming',
    'heatingType.electric': 'Elektrisch',
    'heatingType.unknown': 'Onbekend',

    // General
    'general.year': 'jaar',
    'general.years': 'jaar',
    'general.m2': 'm²',
    'general.perYear': 'per jaar',
    'general.perMonth': 'per maand',
    'general.from': 'Vanaf',
    'general.languageToggle': 'EN',
  },
  en: {
    // Landing page
    'landing.title': 'What could greening your home save you?',
    'landing.subtitle': 'Enter your address to see which upgrades pay off most — honest, independent, no sales agenda.',
    'landing.addressPlaceholder': 'Postcode or address...',
    'landing.cta': 'Analyse my home',
    'landing.privacy': 'We don\'t store any personal data. All calculations are based on public sources.',
    'landing.loading.bag': 'Fetching building data...',
    'landing.loading.energy': 'Looking up energy label...',
    'landing.loading.solar': 'Calculating solar potential...',
    'landing.loading.neighbourhood': 'Loading neighbourhood data...',

    // Profile
    'profile.title': 'Does this look right?',
    'profile.subtitle': 'We built your home profile from public data. Correct anything that\'s wrong.',
    'profile.yearBuilt': 'Year built',
    'profile.floorArea': 'Floor area',
    'profile.buildingType': 'Building type',
    'profile.energyLabel': 'Energy label',
    'profile.heating': 'Heating',
    'profile.insulation': 'Insulation',
    'profile.uploadBill': 'Upload your energy bill for more accurate results',
    'profile.uploadBillHint': 'Optional — nothing is stored',
    'profile.confirm': 'Looks right, show my results',
    'profile.monument': 'Listed building',
    'profile.monumentTooltip': 'Some exterior works may require a permit — check with your municipality.',
    'profile.vve': 'Owners\' association (VvE)',
    'profile.vveNote': 'Check with your VvE before making any exterior changes.',

    // Results
    'results.sortBy': 'Sort by',
    'results.sortSavings': 'Annual savings',
    'results.sortRoi': 'Payback period',
    'results.sortCo2': 'CO₂ reduction',
    'results.sortIndependence': 'Energy independence',
    'results.summary.maxSavings': 'Max. annual savings',
    'results.summary.bestPayback': 'Best payback period',
    'results.summary.co2': 'CO₂ reducible',
    'results.summary.subsidies': 'Subsidies available',
    'results.neighbourContext': 'Homes in your postcode average label {label} — yours is label {yourLabel}',
    'results.priceScenario.current': 'Current prices',
    'results.priceScenario.peak2022': '2022 peak',
    'results.priceScenario.conservative': 'Conservative',
    'results.priceScenario.contract': 'Current contract',
    'results.priceScenarioLabel': 'Calculate with',
    'results.card.perMonth': '/mo',
    'results.card.perYear': '/yr',
    'results.card.payback': 'Payback',
    'results.card.paidOff': 'Paid off',
    'results.card.freeSavings': 'years of free savings',
    'results.card.totalReturn': '~€{amount} total return by {year}',
    'results.card.co2': 'CO₂ reduction',
    'results.card.co2Driving': '= {km} km less driving/yr',
    'results.card.independence': 'Energy independence',
    'results.card.gasReduction': '% less gas',
    'results.card.solarProduction': '% self-produced',
    'results.card.askClaude': 'Ask Claude ↗',
    'results.card.findInstallers': 'Find installers ↗',
    'results.card.applySubsidy': 'Apply for subsidy ↗',
    'results.card.subsidyDeadline': 'Budget typically exhausted by {deadline}',
    'results.card.gridCongestion': 'Note: this postcode has reported grid congestion — connecting a heat pump may face delays.',
    'results.card.vveBlocked': 'Requires owners\' association (VvE) approval',
    'results.card.requiresBefore': 'Less effective without {upgrade} — consider doing that first.',
    'results.card.benefitsFrom': 'Combine with {upgrade} to save ~{saving} on installation cost.',
    'results.card.costReality': 'Most people expect this to cost €{expected} — typical actual cost is €{actual}',
    'results.card.propertyValue': 'Upgrading from label {from} to {to} typically adds €{min}–{max} to resale value.',
    'results.card.confidenceEpc': 'Based on your registered EPC data',
    'results.card.confidenceEra': 'Estimated from your home\'s build era',
    'results.card.confidenceBill': 'Based on your actual energy bill',

    // Tags
    'tag.top-pick': 'Top pick',
    'tag.quick-win': 'Quick win',
    'tag.strong': 'Strong',
    'tag.high-impact': 'High impact',
    'tag.long-game': 'Long game',
    'tag.comfort-boost': 'Comfort boost',

    // Building types
    'buildingType.terraced': 'Terraced house',
    'buildingType.semi-detached': 'Semi-detached',
    'buildingType.detached': 'Detached',
    'buildingType.apartment': 'Apartment',
    'buildingType.corner': 'Corner house',

    // Heating types
    'heatingType.gas-boiler': 'Gas boiler',
    'heatingType.heat-pump-air': 'Air-source heat pump',
    'heatingType.heat-pump-ground': 'Ground-source heat pump',
    'heatingType.district-heating': 'District heating',
    'heatingType.electric': 'Electric',
    'heatingType.unknown': 'Unknown',

    // General
    'general.year': 'year',
    'general.years': 'years',
    'general.m2': 'm²',
    'general.perYear': 'per year',
    'general.perMonth': 'per month',
    'general.from': 'From',
    'general.languageToggle': 'NL',
  }
} as const

export type TranslationKey = keyof typeof translations.nl

export function t(key: TranslationKey, locale: Locale, vars?: Record<string, string | number>): string {
  const str: string = translations[locale][key] ?? translations.nl[key] ?? key
  if (!vars) return str
  return Object.entries(vars).reduce<string>(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    str
  )
}
