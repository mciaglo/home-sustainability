import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const VALID_TASKS = ['energy-prices', 'co2-factors', 'subsidies', 'grid-congestion', 'all'] as const
type Task = typeof VALID_TASKS[number]

const CACHE_DIR = path.join(process.cwd(), 'data', 'cached')

const CBS_ODATA4 = 'https://odata4.cbs.nl/CBS'
const CBS_ENERGY_TABLE = '84672NED'

interface TaskResult {
  status: 'updated' | 'fresh' | 'stale' | 'error'
  message: string
  data?: Record<string, unknown>
}

function monthsSince(dateStr: string): number {
  const [y, m] = dateStr.split('-').map(Number)
  const then = new Date(y, m - 1)
  const now = new Date()
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
}

async function checkFreshness(filename: string, maxMonths: number): Promise<TaskResult> {
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, filename), 'utf-8')
    const data = JSON.parse(raw)
    const updated = data._updated as string
    if (!updated) return { status: 'error', message: `No _updated field in ${filename}` }

    const age = monthsSince(updated)
    if (age <= maxMonths) {
      return { status: 'fresh', message: `${filename} updated ${updated} (${age} month(s) ago)` }
    }
    return { status: 'stale', message: `${filename} is ${age} month(s) old (updated ${updated}). Manual update recommended.` }
  } catch (err) {
    return { status: 'error', message: `Failed to read ${filename}: ${err}` }
  }
}

async function writeCache(filename: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    await fs.writeFile(
      path.join(CACHE_DIR, filename),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8'
    )
    return true
  } catch {
    return false
  }
}

async function refreshEnergyPrices(): Promise<TaskResult> {
  try {
    const cacheFile = 'energy-prices.json'
    const existing = JSON.parse(await fs.readFile(path.join(CACHE_DIR, cacheFile), 'utf-8'))

    const periods = await fetchCbs(`${CBS_ENERGY_TABLE}/Perioden?$orderby=Identifier desc&$top=3`)
    if (!periods) return { status: 'error', message: 'Failed to fetch CBS periods' }

    const latestPeriod = periods[0]?.Identifier
    if (!latestPeriod) return { status: 'error', message: 'No periods found in CBS table' }

    const measures = await fetchCbs(`${CBS_ENERGY_TABLE}/MeasureCodes`)
    if (!measures) return { status: 'error', message: 'Failed to fetch CBS measure codes' }

    const observations = await fetchCbs(
      `${CBS_ENERGY_TABLE}/Observations?$filter=Perioden eq '${latestPeriod}'`
    )
    if (!observations) return { status: 'error', message: 'Failed to fetch CBS observations' }

    const parsed = parseCbsEnergyPrices(observations, measures)
    if (!parsed) {
      return {
        status: 'error',
        message: 'Could not parse energy prices from CBS data. Raw data returned for manual review.',
        data: {
          period: latestPeriod,
          measureCodes: measures.map((m: Record<string, unknown>) => ({
            id: m.Identifier, title: m.Title,
          })),
          sampleObservations: observations.slice(0, 10),
        },
      }
    }

    if (parsed.gasEuroPerM3 < 0.5 || parsed.gasEuroPerM3 > 5.0) {
      return { status: 'error', message: `Gas price out of bounds: €${parsed.gasEuroPerM3}/m³`, data: parsed }
    }
    if (parsed.electricityEuroPerKwh < 0.05 || parsed.electricityEuroPerKwh > 1.5) {
      return { status: 'error', message: `Electricity price out of bounds: €${parsed.electricityEuroPerKwh}/kWh`, data: parsed }
    }

    const now = new Date()
    const updatedTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const updated = {
      ...existing,
      _source: 'CBS Statline ' + CBS_ENERGY_TABLE,
      _updated: updatedTag,
      gasEuroPerM3: Math.round(parsed.gasEuroPerM3 * 100) / 100,
      electricityEuroPerKwh: Math.round(parsed.electricityEuroPerKwh * 100) / 100,
    }

    const written = await writeCache(cacheFile, updated)

    return {
      status: 'updated',
      message: written
        ? `Energy prices updated from CBS period ${latestPeriod}`
        : `Prices fetched from CBS (period ${latestPeriod}) but filesystem is read-only. Deploy with updated values.`,
      data: { period: latestPeriod, written, ...updated },
    }
  } catch (err) {
    return { status: 'error', message: `Energy price refresh failed: ${err}` }
  }
}

async function fetchCbs(path: string): Promise<Record<string, unknown>[] | null> {
  try {
    const res = await fetch(`${CBS_ODATA4}/${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      console.error(`CBS API ${path}: ${res.status} ${res.statusText}`)
      return null
    }
    const data = await res.json()
    return data?.value ?? null
  } catch (err) {
    console.error(`CBS fetch ${path}:`, err)
    return null
  }
}

function parseCbsEnergyPrices(
  observations: Record<string, unknown>[],
  measures: Record<string, unknown>[],
): { gasEuroPerM3: number; electricityEuroPerKwh: number } | null {
  const measureMap = new Map<string, string>()
  for (const m of measures) {
    measureMap.set(m.Identifier as string, ((m.Title as string) ?? '').toLowerCase())
  }

  let gasTotal = 0
  let gasCount = 0
  let elecTotal = 0
  let elecCount = 0

  for (const obs of observations) {
    const value = obs.Value as number | null
    if (value == null) continue
    const measureId = obs.Measure as string
    const title = measureMap.get(measureId) ?? ''
    const carrier = String(obs.Energiedragers ?? '')

    const isGas = carrier.includes('gas') || carrier.includes('3100') || carrier.includes('T001396')
    const isElec = carrier.includes('elek') || carrier.includes('4100') || carrier.includes('T001397')
    const isTotal = title.includes('totaal') || title.includes('total') || title.includes('variabel leveringstarief')
    const isConsumer = !title.includes('industri')

    if (isGas && isConsumer && (isTotal || title.includes('leveringstarief'))) {
      gasTotal += value
      gasCount++
    }
    if (isElec && isConsumer && (isTotal || title.includes('leveringstarief'))) {
      elecTotal += value
      elecCount++
    }
  }

  if (gasCount === 0 || elecCount === 0) return null

  return {
    gasEuroPerM3: gasTotal / gasCount,
    electricityEuroPerKwh: elecTotal / elecCount,
  }
}

export async function GET(req: NextRequest) {
  const task = (req.nextUrl.searchParams.get('task') ?? 'all') as Task

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const cronSecret = req.headers.get('authorization')
  if (cronSecret !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!VALID_TASKS.includes(task)) {
    return NextResponse.json(
      { error: `Unknown task: ${task}. Valid: ${VALID_TASKS.join(', ')}` },
      { status: 400 },
    )
  }

  const results: Record<string, TaskResult> = {}

  if (task === 'energy-prices' || task === 'all') {
    results['energy-prices'] = await refreshEnergyPrices()
  }
  if (task === 'co2-factors' || task === 'all') {
    results['co2-factors'] = await checkFreshness('co2-factors.json', 6)
  }
  if (task === 'grid-congestion' || task === 'all') {
    results['grid-congestion'] = await checkFreshness('grid-congestion.json', 3)
  }
  if (task === 'subsidies' || task === 'all') {
    results['subsidies'] = await checkFreshness('subsidies/nl-national.json', 6)
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    task,
    results,
  })
}
