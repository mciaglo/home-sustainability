import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron refresh endpoint.
 * Triggered by Vercel Cron (vercel.json) to refresh cached data files.
 * Each task fetches from source, validates, and writes to /data/cached/ only if valid.
 *
 * Tasks: energy-prices | co2-factors | subsidies | grid-congestion | subsidy-status
 */
export async function GET(req: NextRequest) {
  const task = req.nextUrl.searchParams.get('task')

  // In production, protect this endpoint
  const cronSecret = req.headers.get('authorization')
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    switch (task) {
      case 'energy-prices':
        // TODO: fetch from CBS Statline API and write to data/cached/energy-prices.json
        return NextResponse.json({ task, status: 'stub — not yet implemented' })

      case 'co2-factors':
        // TODO: update from CE Delft annual publication
        return NextResponse.json({ task, status: 'stub — not yet implemented' })

      case 'subsidies':
        // TODO: check RVO for ISDE amount changes
        return NextResponse.json({ task, status: 'stub — not yet implemented' })

      case 'grid-congestion':
        // TODO: fetch from Netbeheer Nederland open data portal
        return NextResponse.json({ task, status: 'stub — not yet implemented' })

      case 'subsidy-status':
        // TODO: monitor subsidy budget status on RVO
        return NextResponse.json({ task, status: 'stub — not yet implemented' })

      default:
        return NextResponse.json({ error: `Unknown task: ${task}` }, { status: 400 })
    }
  } catch (err) {
    console.error(`cron/${task} failed`, err)
    return NextResponse.json({ error: 'Cron task failed' }, { status: 500 })
  }
}
