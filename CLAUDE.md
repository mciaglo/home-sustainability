# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A free, stateless web tool for EU homeowners (starting with the Netherlands) that takes a home address and returns a personalised, ranked list of green home upgrades — ordered by annual energy savings, with ROI, CO₂ impact, and energy independence as supporting metrics. No accounts, no stored profiles, GDPR-simple by design.

## Commands

_Add build, run, test, and lint commands here once the project is scaffolded._

Planned stack: `Next.js 14 (App Router) + TypeScript + Tailwind CSS`, hosted on Vercel.

## Architecture

### High-level flow
1. **Landing page** — Dutch postcode/address input, Street View photo shown immediately
2. **Auto-profile** — BAG + EP-online + CBS APIs infer year built, floor area, energy label, insulation levels, heating type, solar potential
3. **Profile confirmation** — user can correct any inferred field; optional energy bill PDF upload (client-side OCR, never stored)
4. **Results page** — ranked upgrade cards, sort by savings/ROI/CO₂/independence, subsidy inline on each card, energy price scenario toggle
5. **Financing screen** (optional) — 10-year cost model, loan options; skippable

### Key architectural decisions
- **No database in v1.** Fully stateless. All data is either fetched live per request or read from cached JSON files.
- **Country adapter pattern.** Each country implements a `CountryAdapter` interface (`fetchBuildingData`, `fetchEnergyLabel`, `getSubsidies`). NL is the only adapter in v1; adding DE/FR/BE means a new adapter + new subsidy JSON file.
- **Subsidies are static JSON**, not live API calls. Updated manually ~2x/year. Matched inline on each upgrade card — no separate subsidy screen.
- **Cron refresh pattern.** External reference data (energy prices, CO₂ factors, grid congestion) is fetched by scheduled cron jobs and written to `/data/cached/`. The app always reads from cache. A failed fetch never overwrites the last good cache.
- **Calculations follow NTA 8800 methodology** — the official Dutch standard. Heat loss = U-value × surface area × heating degree days. Primary data from EP-online; fallback to build-era lookup table; user corrections take highest precedence.

### Data sources (NL v1)
| Source | Data | Notes |
|---|---|---|
| BAG (Kadaster) | Address, year built, floor area, building type, monument status | Free REST API |
| EP-online (RVO) | Energy label, detailed EPC data | Free with RVO registration |
| CBS Statline | Neighbourhood energy stats, avg EPC by postcode | Open REST API |
| PVGIS (EU Commission) | Solar irradiance | Free, already EU-wide |
| RVO / ISDE | Subsidy amounts | Static JSON, updated 2x/year |
| KNMI | Heating degree days by postcode | Static, updated annually |
| Netbeheer Nederland | Grid congestion by postcode | Only queried if heat pump is in top 3 |
| Google Street View Static API | Property photo | Requires API key |

### File structure
```
/
├── app/
│   ├── page.tsx                    # Landing — address input
│   ├── profile/page.tsx            # Profile confirmation
│   ├── results/page.tsx            # Results page
│   ├── financing/page.tsx          # Optional financing screen
│   └── api/
│       ├── lookup/route.ts         # BAG + EP-online + CBS
│       ├── solar/route.ts          # PVGIS
│       ├── streetview/route.ts     # Street View proxy (keeps API key server-side)
│       └── cron/refresh/route.ts   # Scheduled cache refresh
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
│   ├── adapters/nl.ts              # Netherlands CountryAdapter implementation
│   ├── recommendations.ts          # Upgrade scoring + ranking
│   ├── subsidies.ts                # Subsidy matching from static JSON
│   ├── combinations.ts             # Bundle/dependency logic
│   └── co2.ts                      # CO₂ calculations + human equivalents
├── data/
│   ├── cached/                     # Written by cron, read by app
│   │   ├── energy-prices.json
│   │   ├── co2-factors.json
│   │   ├── subsidy-status.json
│   │   ├── grid-congestion.json
│   │   └── subsidies/
│   │       ├── nl-national.json
│   │       └── nl-provincial.json
│   └── static/                     # Manual updates, version controlled
│       ├── nta8800-u-values.json
│       ├── heating-degree-days.json
│       ├── upgrade-definitions.json
│       └── build-era-lookup.json
└── types/
    ├── home-profile.ts
    ├── upgrade.ts
    └── country-adapter.ts
```

### Calculation methodology
- **Heat loss model**: `saved energy = (U_before − U_after) × area × heating_degree_days`
- **Annual saving (€)**: saved energy × CBS energy price (from cache)
- **CO₂ (gas)**: m³ saved × 1.884 kg CO₂/m³
- **CO₂ (electricity)**: kWh × declining grid factor (CE Delft curve, not a flat rate — matters for heat pump lifetime projections)
- **Solar**: delegated entirely to PVGIS API
- Confidence shown per-result: "Based on registered EPC" / "Estimated from build era" / "Based on your energy bill"

### Results page behaviour
- Default sort: annual savings (€/yr). Other sorts: ROI, CO₂, energy independence.
- When sorted by ROI, cards auto-group: Quick wins (<2.5yr) / Good investments (2.5–10yr) / Long game (10yr+).
- Subsidies shown inline on every relevant card — net cost always shown after subsidy, with deadline warning if applicable.
- Combination logic shown inline on cards (dependency warnings, scaffold savings) — never prescriptive, never a roadmap.
- VvE/apartment detected from BAG; exterior upgrades greyed out with explanation, no separate flow.
- Grid congestion: one inline warning on heat pump card only, shown only if postcode has confirmed congestion.

### Design principles
- **Savings first**: annual € saving is the primary number on every card
- **Honest about boring upgrades**: draught-proofing and smart thermostats appear at the top when sorted by ROI — intentional
- **Subsidies inline, not separate**: every price shown is net of applicable subsidy
- **CO₂ always translated**: never show raw tonnes without a human equivalent (default: "= X,000 km less driving/yr")
- **Informational, not prescriptive**: surface dependencies and synergies; don't tell the user what order to do things
- **Stateless by default**: no accounts, no cookies beyond session
- **EU-ready architecture**: NL is adapter #1; adding a country = new adapter + new subsidy JSON

### Out of scope for v1
Installer finder, accounts/saved profiles, subsidy application guides, DIY guides, email alerts, business model features (lead gen, white-label, referral fees), DE/FR/BE adapters, multilingual UI beyond EN + NL.

## Git Workflow

Commit and push to GitHub regularly throughout development — after each meaningful unit of work (new feature, bug fix, refactor). This ensures no progress is ever lost.

- Write clean, descriptive commit messages that explain *what* changed and *why*
- Push after every commit, not just at the end of a session
- Never leave significant work uncommitted
