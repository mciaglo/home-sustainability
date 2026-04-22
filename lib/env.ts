const required: { key: string; desc: string }[] = [
  { key: 'RVO_API_KEY', desc: 'EP-online energy label lookups' },
]

const optional: { key: string; desc: string }[] = [
  { key: 'GOOGLE_MAPS_API_KEY', desc: 'Street View property photos' },
  { key: 'BAG_API_KEY', desc: 'Kadaster BAG API (falls back to PDOK WFS)' },
  { key: 'RESEND_API_KEY', desc: 'Quote request emails' },
  { key: 'CRON_SECRET', desc: 'Cron endpoint authentication' },
]

let validated = false

export function validateEnv() {
  if (validated) return
  validated = true

  const missing: string[] = []
  const warnings: string[] = []

  for (const { key, desc } of required) {
    if (!process.env[key]) missing.push(`  ${key} — ${desc}`)
  }
  for (const { key, desc } of optional) {
    if (!process.env[key]) warnings.push(`  ${key} — ${desc}`)
  }

  if (missing.length) {
    console.error(`[env] Missing required environment variables:\n${missing.join('\n')}`)
  }
  if (warnings.length) {
    console.warn(`[env] Missing optional environment variables (features disabled):\n${warnings.join('\n')}`)
  }
}
