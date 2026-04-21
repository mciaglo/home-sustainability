import { NextRequest, NextResponse } from 'next/server'

const VALID_TASKS = ['energy-prices', 'co2-factors', 'subsidies', 'grid-congestion', 'subsidy-status'] as const

export async function GET(req: NextRequest) {
  const task = req.nextUrl.searchParams.get('task')

  const cronSecret = req.headers.get('authorization')
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!task || !VALID_TASKS.includes(task as typeof VALID_TASKS[number])) {
    return NextResponse.json({ error: `Unknown task: ${task}. Valid: ${VALID_TASKS.join(', ')}` }, { status: 400 })
  }

  return NextResponse.json({
    task,
    status: 'not-implemented',
    message: 'Cron data refresh is not yet implemented. Cached data in /data/cached/ is updated manually.',
  })
}
