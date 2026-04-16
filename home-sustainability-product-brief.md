# Home Sustainability App — Product Brief
*For use with Claude Code. Read this entire document before asking clarifying questions or writing any code.*

---

## 1. Product vision

A free, independent web tool for EU homeowners that takes a home address and returns a personalised, ranked list of green home upgrades — ordered by annual energy savings, with ROI, CO₂ impact, and energy independence as supporting metrics.

The core differentiator is **honest, independent information**. Every existing tool (Verbetercheck, Enter, Dryft) either lacks ROI transparency or suppresses it because they have a commercial interest in specific products (heat pumps, solar). This tool has no such conflict. It will show that draught-proofing at €200 with a 1.5-year payback beats a heat pump at €15k with a 15-year payback on pure financial return — and let the user decide what matters to them.

**The tool is free to use. Monetisation comes later** via installer lead generation, white-label licensing to banks and municipalities, and financing referral fees. These should be architecturally possible but are not built in v1.

---

## 2. Target user

EU homeowners, starting with the Netherlands. Specifically:
- Owners of houses built before 1992 (highest upgrade potential)
- People who just bought a home and are thinking about improvements
- People whose boiler just broke and need to make a fast decision
- People who are vaguely aware they "should do something" but find the topic overwhelming

**Not** renters. Not commercial property owners. Apartments (VvE) are in scope but handled correctly within the same flow — no separate path needed, just correct logic that filters/adapts recommendations based on ownership type.

---

## 3. Competitive landscape

| Tool | Country | What it does | Key weakness |
|---|---|---|---|
| Verbetercheck (Milieu Centraal) | NL | Full wizard, postcode lookup, per-element insulation, savings estimate | No ROI ranking, NL only, no payback period shown |
| Enter (formerly Baupal) | DE | 250 data points, 8 questions, virtual retrofit, financing | Sales-focused, ROI buried, DE/AT only, €40M raised |
| Kelvin | FR | AI energy audits — B2B only, sells to contractors | Not consumer-facing |
| Dryft | SE | Home renovation marketplace (pivoted away from energy) | No longer energy-focused |
| Novo | DE | B2B energy renovation planning via banks | Not consumer-facing |
| BERWOW | IE | BER certificate analysis | GDPR friction, IE only |

**White space this product occupies:**
- Honest ROI ranking showing ALL upgrades including boring high-ROI ones (draught-proofing, smart thermostat)
- Combination logic — what needs to be done together vs what benefits from being combined
- Subsidy deadlines surfaced inline, not buried
- Property value uplift shown alongside energy savings
- Neighbour benchmarking using postcode data
- Works across EU from the start (NL first, architecture ready for DE/FR/BE)

---

## 4. User flow

### Step 1 — Address input (landing page)
- Clean address input with Dutch postcode autocomplete
- Street View photo shown immediately to build trust
- On submit: fetch data from public sources (see section 6)
- Loading screen shows which sources are being queried

### Step 2 — Auto-profile generated
From address + public data sources, infer:
- Year built, floor area, building type (BAG)
- Energy label A–G (EP-online)
- Likely insulation levels (lookup table by build era)
- Heating type (inferred from build era + label)
- Estimated annual energy cost (CBS neighbourhood averages)
- Solar potential (PVGIS irradiance for postcode)
- Roof orientation (building footprint + satellite data where available)
- Monument / protected building status (BAG — shown as passive badge, not a blocker)
- VvE / apartment flag (BAG building type)
- Grid congestion status (Netbeheer Nederland data — only surfaced if relevant to heat pump recommendation)
- Neighbour benchmarking — average EPC label for postcode (CBS)

**Build era → insulation lookup table (NL):**
| Era | Wall | Roof | Floor | Glazing |
|---|---|---|---|---|
| Pre-1920 | None | None | None | Single |
| 1920–1945 | None | None | None | Single/old double |
| 1946–1974 | None/partial cavity | None/partial | None | Old double |
| 1975–1991 | Partial cavity | Partial | Partial | Double |
| 1992–2005 | Cavity | Good | Good | HR++ |
| 2006–2014 | Good | Good | Good | HR++ |
| 2015+ | Very good | Very good | Very good | Triple |

### Step 3 — Profile confirmation ("Does this look right?")
- Show home photo, building type, year built, floor area, energy label
- Show inferred insulation levels, heating type, estimated energy cost
- Allow user to correct any field
- Optional: upload energy bill PDF (OCR to extract actual m³ gas + kWh) — framed as "get more accurate results", not required. No data stored.
- If VvE/apartment detected: adapt upgrade options silently (filter out upgrades requiring VvE approval, add note where relevant)

### Step 4 — Results page
Core of the product. See Section 5.

### Step 5 — (Optional) Financing screen
Financing information lives **inside each upgrade card** (see Section 5 card spec), not on a separate screen. The card expanded view shows: total cost → subsidy deducted → monthly saving → payback timeline. This is the primary financial decision surface.

An optional separate financing screen is available after results for users who want to explore loan options in more depth:
- Projected energy costs over 10 years with vs without selected upgrades
- Loan options (Energiebespaarlening, green mortgage top-up)
- Monthly net cost after savings for financed upgrades
- Subsidy application links

This screen is skippable and should not feel like a sales page. Most users will get everything they need from the card expanded views.

---

## 5. Results page — detailed spec

### Header
- Address + home summary (year, area, type, current EPC label)
- Summary strip: max annual savings possible · best payback period · total CO₂ reducible · subsidies available
- Neighbour context line: "Homes in your postcode average label D — yours is E"

### Sort controls
Four sort modes. Default is **Annual savings**.
1. Annual savings (€/yr) — default
2. ROI / payback (years)
3. CO₂ reduction (tonnes/yr, shown as driving equivalent)
4. Energy independence (% gas reduction)

When sorted by ROI, cards automatically group into sections: "Quick wins (under 2.5yr)", "Good investments (2.5–10yr)", "Long game (10yr+)"

### Upgrade cards

**Collapsed state** shows:
- Rank number (circle)
- Upgrade name + one-line description personalised to the home
- Monthly saving (€/mo) — primary number, shown in green
- Payback in years
- Tag badge (see tags below)
- Expand chevron

**Expanded state** layout — in this exact order:

1. **Body header** — upgrade name (repeated) + tag badge

2. **Financial grid (2 columns):**
   - *Total cost* — gross cost shown with strikethrough if subsidy applies, net cost below it in full size, subsidy name + amount + deadline warning in amber text underneath
   - *Monthly saving* — €X/mo in green, €Y/yr + energy source below

3. **Divider**

4. **Timing section:**
   - Left: paid-off year (large, e.g. "2029") + "Paid off in X years" below
   - Divider line (vertical)
   - Right: "X years of free savings" (green, bold) + "~€Y total return by YYYY" below
   - Red/green bar immediately below — red segment = recoup period, green segment = free savings period, proportional to lifespan
   - Bar labels: "Now" · "Paid off" · end year

5. **Divider**

6. **Supporting pillars (2 columns):**
   - *CO₂ reduction* — X t/yr + translated equivalent ("= X,000 km less driving/yr")
   - *Energy independence* — X% gas reduction or X% electricity self-produced

7. **Meta line** — difficulty + lifespan (e.g. "Professional · 1–2 days · Lifespan: 30 years")

8. **Action buttons** — "Ask Claude ↗" · "Find installers ↗" · "Apply for subsidy ↗" (subsidy button only shown if subsidy applies)

**Tag visibility rule:** Tag badge is visible in BOTH collapsed and expanded states. In collapsed state it sits in the header row. In expanded state it sits next to the upgrade name at the top of the body.

### Tags
| Tag | Meaning | Style |
|---|---|---|
| Top pick | Strong on multiple dimensions | Green |
| Quick win | Payback ≤ 2.5 years | Blue |
| Strong | Good ROI + meaningful impact | Green |
| High impact | High CO₂/independence, longer payback | Blue |
| Long game | 10yr+ payback, but major impact | Amber |
| Comfort boost | Primarily improves comfort, moderate savings | Purple |

### Combination logic
Where upgrades interact, show this inline — not as a separate section:
- **Must combine**: "Heat pump will be significantly less effective without insulation first. Consider doing these together."
- **Benefits from combining**: "Roof + wall insulation on the same scaffold saves ~15% on installation cost."
- **Cannot combine (VvE)**: If user is in apartment/VvE, grey out upgrades requiring exterior work with explanation.

This is informational, not prescriptive. The tool does not tell the user what order to do things or build a "recommended roadmap." It surfaces dependencies and synergies. The user decides.

### Cost reality-check
On relevant cards, show: "Most people expect this to cost €X — typical actual cost is €Y." Use real market data. This is one of the most impactful conversion features given research showing people systematically overestimate costs by 2–3x.

### Subsidy integration
Subsidies are **not a separate feature**. They are woven into every relevant card:
- Net cost always shown after subsidy deduction
- Subsidy name + amount shown in expanded view
- Deadline warning shown inline if subsidy budget typically runs out (e.g. "ISDE — budget typically exhausted by October")
- No separate subsidy screen or matcher

### Energy price scenarios
Small toggle on results page: "Calculate savings at: [current prices] [2022 peak] [conservative]" — recalculates all savings numbers. Shows users how good the investment would have been at 2022 prices and how conservative the current estimate is.

### Property value uplift
Shown in expanded card view: "Upgrading from label E to B typically adds €X–Y to the resale value of a home this size in this region." Based on WOZ/transaction data. Shown as a range, not a precise number.

---

## 6. Data sources

### Netherlands (v1)

| Source | Data | Access | Notes |
|---|---|---|---|
| BAG (Kadaster) | Address, year built, floor area, building type, monument status | REST API — `api.bag.kadaster.nl` | Free, open |
| EP-online (RVO) | Official energy label A–G, detailed EPC data | REST API — free key from RVO | Free with registration |
| CBS Statline | Neighbourhood energy stats, average EPC by postcode | REST API — `opendata.cbs.nl` | Fully open |
| PVGIS (EU Commission) | Solar irradiance by location | REST API — `re.jrc.ec.europa.eu/pvgis` | Free, EU-wide |
| RVO / ISDE | Subsidy amounts and eligibility | **Static lookup table** — update 2x/year | Province level is sufficient |
| KNMI | Climate zone, heating degree days | Static data by postcode | Pre-load, not live |
| Netbeheer Nederland | Grid congestion by postcode | Open data portal | Only query if heat pump in top 3 recommendations |
| Google Street View | Property photo | Street View Static API | Requires API key |

### Subsidy data approach
Use a **static JSON lookup table** per province, not live API calls. Structure:
```json
{
  "Noord-Holland": {
    "national": [
      { "name": "ISDE warmtepomp", "amount": 5000, "upgrades": ["heat-pump-air", "heat-pump-ground"], "deadline": "October (budget-dependent)", "url": "..." },
      { "name": "ISDE isolatie", "amount": 500, "upgrades": ["roof-insulation", "wall-insulation", "floor-insulation"], "deadline": null, "url": "..." }
    ],
    "provincial": [...],
    "municipal": {
      "Amsterdam": [...],
      "Haarlem": [...]
    }
  }
}
```
Update this file manually ~twice per year. Much more maintainable than live API integration.

### EU expansion — country adapter pattern
Each country implements the same interface:
```typescript
interface CountryAdapter {
  fetchBuildingData(address: string): Promise<BuildingData>
  fetchEnergyLabel(buildingId: string): Promise<EnergyLabel>
  getSubsidies(province: string, upgrades: string[]): Subsidy[]
}
```

Country adapters planned (not v1):
- **Germany**: Geoportal DE + EnEV/GEG register + BAFA (static table)
- **France**: BDNB + ADEME DPE API + MaPrimeRénov (static table)
- **Belgium**: CadGIS/URBIS + EPC Vlaanderen + Premies (static table)

PVGIS already works EU-wide — no adapter needed for solar data.

---

## 7. Calculation methodology

### Core principle
All savings calculations follow the **NTA 8800 methodology** — the official Dutch standard used by RVO to generate EP-online energy labels. This is the most accurate and well-documented approach available. Computational complexity is irrelevant: the calculations are pure arithmetic that runs in milliseconds server-side.

### The heat loss model
Energy saved by an upgrade = reduction in heat loss through that building element.

```
Heat loss (W/K) = U-value × surface area
Annual heat demand (kWh) = heat loss × heating degree days × correction factor
Saved energy = (U_before − U_after) × area × degree days
Annual saving (€) = saved energy (m³ or kWh) × current energy price
```

Where:
- **U-value** = thermal transmittance in W/m²K (from EP-online detailed data, or NTA 8800 reference table by build era)
- **Surface area** = from EP-online detailed data, or estimated from BAG floor area + building type
- **Heating degree days** = KNMI data by postcode (static, updated annually)
- **Energy price** = CBS live gas/electricity price (cached weekly)

### Reference U-values (NTA 8800 table, by build era)
Used as fallback when EP-online detailed data is unavailable.

| Element | Pre-1945 | 1945–1974 | 1975–1991 | 1992–2005 | 2006–2014 | 2015+ |
|---|---|---|---|---|---|---|
| External wall | 1.8 | 1.5 | 0.8 | 0.4 | 0.28 | 0.22 |
| Roof | 2.0 | 1.8 | 0.5 | 0.4 | 0.25 | 0.20 |
| Floor | 1.5 | 1.2 | 0.7 | 0.4 | 0.28 | 0.22 |
| Glazing (single) | 5.8 | 5.8 | — | — | — | — |
| Glazing (double) | — | — | 2.9 | 2.9 | — | — |
| Glazing (HR++) | — | — | — | — | 1.2 | 1.2 |
| Glazing (triple) | — | — | — | — | — | 0.7 |

*All values in W/m²K. Source: RVO NTA 8800 reference tables.*

### Target U-values after upgrade
| Upgrade | Target U-value | Standard achieved |
|---|---|---|
| Cavity wall fill | 0.35 | Rc 2.9 |
| External wall insulation (good) | 0.22 | Rc 4.5 |
| Roof insulation (good) | 0.20 | Rc 5.0 |
| Floor insulation (good) | 0.22 | Rc 4.5 |
| HR++ glazing | 1.2 | Standard NL |
| Triple glazing | 0.7 | High spec |

### Primary vs fallback data path
1. **Primary**: Fetch EP-online detailed data for the address. If available, use actual U-values, surface areas, and heating system efficiency from the registered EPC. This covers ~70% of Dutch homes with a registered label.
2. **Fallback**: If EP-online data is incomplete or unavailable, use the NTA 8800 reference table (above) based on build era, combined with surface areas estimated from BAG floor area and building type.
3. **User override**: Any value the user corrects on the profile screen (actual insulation type, actual heating system, uploaded bill data) takes precedence over both primary and fallback.

### Confidence indicator
Every calculation carries a confidence level shown subtly on the results page:
- **"Based on your registered EPC data"** — EP-online detailed data used (high confidence)
- **"Estimated from your home's build era"** — fallback lookup table used (lower confidence, encourage profile improvement)
- **"Based on your actual energy bill"** — user-uploaded bill data used (highest confidence)

The confidence indicator gives users a concrete reason to improve their profile data if they want more accurate numbers.

### CO₂ calculations
```
CO₂ saved (gas) = m³ saved × 1.884 kg CO₂/m³  (standard NL factor)
CO₂ saved (electricity) = kWh saved × grid CO₂ factor (kg/kWh)
```

**Grid CO₂ factor** declines over time as renewables expand. Use CE Delft annual projections rather than a flat factor — this is what RVO uses in official calculations and it matters significantly for heat pump long-term CO₂ projections.

| Year | NL grid CO₂ factor (kg/kWh) |
|---|---|
| 2025 | 0.45 |
| 2027 | 0.38 |
| 2030 | 0.28 |
| 2033 | 0.18 |
| 2035 | 0.10 |

*Source: CE Delft / PBL Klimaat- en Energieverkenning. Update annually via cron job.*

For long-term projections (e.g. heat pump over 20 years), use the declining factor curve rather than today's static factor. This means a heat pump's CO₂ story gets *better* over its lifetime — show this honestly.

### Solar calculations
Use PVGIS API directly — no manual calculation needed. Inputs: latitude/longitude, roof tilt, roof orientation (from BAG footprint), system size. PVGIS returns annual kWh generation. Convert to savings using CBS electricity price.

### Cost ranges
All installation cost ranges sourced from **Milieu Centraal published ranges** (updated annually) and **Verbetercheck cost data** (cited by RVO). Always show as a range, never a single number. Flag that actual quotes vary by region, home size, and access difficulty.

---

## 8. Caching architecture

### Principle
Anything that comes from an external source and does not change per-user-request is cached, not fetched live. This applies to all reference data, prices, subsidies, and external coefficients. The pattern is: scheduled cron job fetches source → validates response → writes to JSON cache file → app reads from cache. A broken API response never overwrites the last good cache.

### Cache inventory

| Data | Update frequency | Source | Cache strategy | File |
|---|---|---|---|---|
| Gas + electricity prices | Monthly | CBS Statline | Cron weekly | `cached/energy-prices.json` |
| Grid CO₂ factor curve | Annually | CE Delft / PBL | Cron monthly | `cached/co2-factors.json` |
| ISDE subsidy amounts | Annually (Jan) | RVO | Cron monthly | `cached/subsidies/nl-national.json` |
| Subsidy budget status | Unpredictable | RVO monitoring | Cron weekly | `cached/subsidy-status.json` |
| Grid congestion postcodes | Quarterly | Netbeheer NL | Cron monthly | `cached/grid-congestion.json` |
| Provincial/municipal subsidies | 1–2x per year | RVO + manual | Manual + versioned | `cached/subsidies/nl-provincial.json` |
| NTA 8800 U-value table | Rarely | RVO | Manual on spec change | `static/nta8800-u-values.json` |
| Heating degree days | Annually | KNMI | Manual annually | `static/heating-degree-days.json` |
| Upgrade definitions + base data | On product change | Internal | Version controlled | `static/upgrade-definitions.json` |

### File structure

```
/data/
  cached/                          ← written by cron, read by app
    energy-prices.json
    co2-factors.json
    subsidy-status.json
    subsidies/
      nl-national.json
      nl-provincial.json
    grid-congestion.json
  static/                          ← updated manually, version controlled
    nta8800-u-values.json
    heating-degree-days.json
    upgrade-definitions.json
    build-era-lookup.json
```

### Cron job design

Single `/api/cron/refresh` route with named sub-tasks. Triggered by Vercel Cron (defined in `vercel.json`).

```typescript
// vercel.json
{
  "crons": [
    { "path": "/api/cron/refresh?task=energy-prices",   "schedule": "0 6 * * 1"   }, // weekly Monday
    { "path": "/api/cron/refresh?task=subsidies",        "schedule": "0 6 1 * *"   }, // monthly
    { "path": "/api/cron/refresh?task=co2-factors",      "schedule": "0 6 1 * *"   }, // monthly
    { "path": "/api/cron/refresh?task=grid-congestion",  "schedule": "0 6 1 * *"   }, // monthly
    { "path": "/api/cron/refresh?task=subsidy-status",   "schedule": "0 6 * * 1"   }  // weekly Monday
  ]
}
```

Each task follows the same safe-write pattern:
```typescript
async function refreshEnergyPrices() {
  const fresh = await fetchFromCBS()           // fetch new data
  if (!isValid(fresh)) return                  // validate — never write bad data
  const previous = readCache('energy-prices')  // read last good cache
  if (hasChanged(fresh, previous)) {
    writeCache('energy-prices', fresh)         // only write if changed
    log('energy-prices updated')
  }
}
```

### Energy price scenarios
The three price scenarios on the results page (current / 2022 peak / conservative) are calculated entirely client-side from the cached prices — no server call needed at render time.

```typescript
const scenarios = {
  current:      cachedPrices.gas,                    // from CBS cache
  peak2022:     1.85,                                // €/m³ — historical, hardcoded
  conservative: cachedPrices.gas * 0.8              // −20% from current
}
```

---

## 9. Features — selected and scoped

### In v1

**Profile confirmation screen** *(requirement)*
Full step 3 as described above. User can correct any auto-inferred field. Energy bill PDF upload optional — no data stored server-side, OCR runs client-side or is discarded after extraction.

**Street View photo**
Shown on profile confirmation screen. Builds immediate trust. Falls back gracefully if no image available.

**Roof orientation detection**
Use building footprint from BAG + PVGIS orientation data. Auto-populate solar potential without asking the user. Show as data point on solar card, not a separate question.

**EPC label tracker**
On results page header: current label + "potential label after selected upgrades: X". Updates dynamically as user selects/deselects upgrades.

**Combination bundles + roadmap logic** *(merged feature)*
Not a prescriptive roadmap. Surface dependencies and synergies inline on relevant cards:
- Dependency warnings: "Less effective without X first"
- Combination savings: "Do with X to save ~15% on installation"
- No recommended order. No multi-year plan imposed on the user.

**Apartment / VvE handling**
No separate flow. Detected from BAG building type. Behaviour:
- Upgrades requiring exterior work or shared systems are greyed out with explanation
- VvE-relevant note shown where applicable ("Check with your VvE before proceeding")
- All other upgrades shown normally

**Energy bill upload**
Optional on profile confirmation screen. PDF only. Extract gas m³ and electricity kWh. Replace estimated figures with actual. No file stored after extraction. Framed as "get more accurate results" — not required.

**Grid congestion**
Not a map. Not a section. One inline warning on the heat pump card only, shown only if the user's postcode has confirmed congestion: "Note: this postcode has reported grid congestion — connection for a heat pump may face delays." Source: Netbeheer Nederland open data.

**Neighbour benchmarking**
Single line in results page header only: "Homes in your postcode average label [X]." One CBS API call. No separate section, no chart.

**Subsidy deadline tracker**
Inline on subsidy strip within each upgrade card. Not a separate feature.

**Energy price scenarios**
Toggle on results page. Three scenarios: current, 2022 peak, conservative (−20%). Recalculates all savings numbers live in the browser — no server call needed.

**Monument / planning checker**
Passive only. Monument status pulled from BAG. Shown as a small badge on the address card: "Rijksmonument." Tooltip: "Some exterior upgrades may require permits — check with your municipality." No separate checker, no API call beyond what BAG already provides.

**Subsidy auto-matcher** *(merged with subsidy display)*
Subsidies matched automatically from the static province lookup table. Shown inline on cards. No separate matcher UI.

**10-year cost model** *(as optional financing screen)*
Not shown in main results. Available as an optional screen after results: shows projected energy costs over 10 years with vs without selected upgrades, loan options, monthly net cost after savings.

**Post-upgrade verification** *(lightweight version)*
Single optional prompt shown after results: "Already done something? Update your numbers." One-time input only — no account required, no data stored. Recalculates remaining recommendations.

**PVGIS pan-EU solar layer**
Use PVGIS for all solar irradiance data from day one. Replaces KNMI for solar specifically. Already EU-wide.

### Explicitly out of scope for v1
- Installer finder / quote request tool (architecture ready, not built)
- Accounts / saved profiles
- Subsidy application guide (link out to RVO instead)
- DIY guides
- Seasonal nudges / email alerts
- Progress sharing / social features
- Business model features (lead gen, white-label, referral fees)
- Germany / France / Belgium adapters (architecture ready, not built)
- Multilingual UI (English + Dutch from start, full i18n later)

---

## 10. Recommended tech stack

```
Frontend:     Next.js 14 (App Router) + TypeScript
Styling:      Tailwind CSS
Data fetching: Server-side API routes (Next.js) — keeps API keys server-side
PDF OCR:      pdf.js (client-side) for bill upload
Hosting:      Vercel
Database:     None in v1 — fully stateless
Subsidies:    Static JSON file in /data/subsidies/
Build era table: Static JSON file in /data/build-era-lookup/
```

**Why no database in v1:** The tool is intentionally stateless. No accounts, no stored profiles, no tracking. This also sidesteps GDPR complexity entirely. If post-upgrade verification or accounts are added later, add a lightweight database (PlanetScale or Supabase) at that point.

**API keys needed:**
- Google Street View Static API (for property photo)
- RVO EP-online API (free registration)
- BAG API key (Kadaster — free)

---

## 11. File structure

```
/
├── app/
│   ├── page.tsx                    # Landing page — address input
│   ├── profile/page.tsx            # Step 3 — confirmation screen
│   ├── results/page.tsx            # Results page
│   ├── financing/page.tsx          # Optional financing screen
│   └── api/
│       ├── lookup/route.ts         # BAG + EP-online + CBS lookup
│       ├── solar/route.ts          # PVGIS solar data
│       └── streetview/route.ts     # Google Street View proxy
├── components/
│   ├── AddressInput.tsx
│   ├── HomeProfile.tsx
│   ├── UpgradeCard.tsx
│   ├── SortControls.tsx
│   ├── EpcTracker.tsx
│   ├── SummaryStrip.tsx
│   ├── PriceScenarioToggle.tsx
│   └── FinancingScreen.tsx
├── lib/
│   ├── adapters/
│   │   └── nl.ts                   # Netherlands country adapter
│   ├── recommendations.ts          # Upgrade scoring + ranking logic
│   ├── subsidies.ts                # Subsidy matching from static data
│   ├── combinations.ts             # Bundle + dependency logic
│   └── co2.ts                      # CO₂ calculation + equivalents
├── data/
│   ├── subsidies/
│   │   └── nl.json                 # Province-level subsidy lookup
│   ├── build-era-lookup.json       # Era → insulation inference table
│   ├── upgrades.json               # All upgrade definitions + base data
│   └── grid-congestion.json        # Affected postcodes (NL)
└── types/
    ├── home-profile.ts
    ├── upgrade.ts
    └── country-adapter.ts
```

---

## 12. Key design principles

1. **Savings first, always.** Annual € saving is the primary number on every card. ROI second, CO₂ third, independence fourth.

2. **Honest about boring upgrades.** Draught-proofing and smart thermostats appear at the top when sorted by ROI. This is intentional.

3. **Subsidies inline, not separate.** Every price shown is net of applicable subsidy. Subsidy name and deadline shown in expanded view. No separate subsidy section.

4. **CO₂ always translated.** Never show raw tonnes without a human equivalent. Default: "= X,000 km less driving/yr."

5. **Informational, not prescriptive.** Surface dependencies and synergies. Don't tell the user what order to do things. Don't build a "recommended roadmap."

6. **Stateless by default.** No accounts, no stored profiles, no cookies beyond session. GDPR-simple.

7. **EU-ready architecture.** Country adapter pattern from day one. NL is the first implementation. Adding DE/FR/BE means writing a new adapter and a new subsidy JSON file — nothing else changes.

8. **Monetisation-ready but not monetised.** Installer CTA buttons exist but link nowhere in v1. Architecture supports lead gen, white-label API, referral fees — none are active yet.

---

## 13. Opening prompt for Claude Code

Paste this at the start of your Claude Code session:

---

*I am building a home sustainability web app for EU homeowners. Please read the attached product brief carefully before doing anything else.*

*The brief covers: product vision, user flow (5 steps), results page spec, data sources, selected features with scope decisions, tech stack (Next.js + TypeScript + Tailwind), file structure, and design principles.*

*Before writing any code:*
*1. Confirm you have understood the brief by summarising the core user flow in 3 sentences*
*2. Ask me any clarifying questions you have*
*3. Propose a build order — which screens and components to build first, second, third*
*4. Wait for my approval before starting*

*Start with the landing page (address input) and the API route that calls the Dutch BAG and EP-online APIs. Do not build everything at once — we will go screen by screen.*

---

## 14. Open questions for later

These are decisions not yet made that will need answering as you build:

- **Installer finder**: Build free first, then charge installers per lead? Or build as paid from the start? Current lean: free first, add monetisation once user base exists.
- **Accounts**: Only add if post-upgrade verification proves popular. Use magic link auth (no passwords) if/when added.
- **White-label**: Architecture supports it (the adapter pattern means a bank or municipality can deploy their own instance). Pricing and contracts TBD.
- **First EU country after NL**: Belgium (Dutch-speaking, natural adjacency) or Germany (largest market)? TBD based on traction.
