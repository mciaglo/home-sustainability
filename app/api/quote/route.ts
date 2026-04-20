import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'missing')
}

interface QuoteRequest {
  name: string
  email: string
  phone: string
  consent: boolean
  postcode: string
  province: string
  yearBuilt: number
  floorArea: number
  buildingType: string
  energyLabel: string
  scenario: string
  upgrades: {
    name: string
    tier: string
    costRange: string
    annualSaving: number
  }[]
  totalAnnualSaving: number
  twentyYearNet: number
}

function validateRequest(body: unknown): body is QuoteRequest {
  const b = body as Record<string, unknown>
  return (
    typeof b.name === 'string' && b.name.length > 0 &&
    typeof b.email === 'string' && b.email.includes('@') &&
    typeof b.phone === 'string' && b.phone.length >= 6 &&
    b.consent === true &&
    typeof b.postcode === 'string' &&
    Array.isArray(b.upgrades)
  )
}

function formatEmailHtml(data: QuoteRequest): string {
  const upgradeRows = data.upgrades.map(u =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${u.name}${u.tier ? ` · ${u.tier}` : ''}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${u.costRange}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">€${Math.round(u.annualSaving).toLocaleString('nl-NL')}/jr</td>
    </tr>`
  ).join('')

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#065f46">Nieuwe offerteaanvraag</h2>
      <p style="color:#666">${new Date().toLocaleString('nl-NL', { dateStyle: 'full', timeStyle: 'short' })}</p>

      <h3 style="color:#1c1917;margin-top:24px">Contactgegevens</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#666">Naam</td><td style="padding:4px 0">${data.name}</td></tr>
        <tr><td style="padding:4px 0;color:#666">E-mail</td><td style="padding:4px 0"><a href="mailto:${data.email}">${data.email}</a></td></tr>
        <tr><td style="padding:4px 0;color:#666">Telefoon</td><td style="padding:4px 0"><a href="tel:${data.phone}">${data.phone}</a></td></tr>
      </table>

      <h3 style="color:#1c1917;margin-top:24px">Woninggegevens</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#666">Postcode</td><td style="padding:4px 0">${data.postcode}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Provincie</td><td style="padding:4px 0">${data.province}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Bouwjaar</td><td style="padding:4px 0">${data.yearBuilt}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Oppervlak</td><td style="padding:4px 0">${data.floorArea} m²</td></tr>
        <tr><td style="padding:4px 0;color:#666">Type</td><td style="padding:4px 0">${data.buildingType}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Energielabel</td><td style="padding:4px 0">${data.energyLabel}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Prijsscenario</td><td style="padding:4px 0">${data.scenario}</td></tr>
      </table>

      <h3 style="color:#1c1917;margin-top:24px">Geselecteerde maatregelen</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f5f5f4;text-align:left">
            <th style="padding:8px 12px">Maatregel</th>
            <th style="padding:8px 12px">Kosten</th>
            <th style="padding:8px 12px">Besparing</th>
          </tr>
        </thead>
        <tbody>${upgradeRows}</tbody>
      </table>

      <div style="margin-top:16px;padding:12px;background:#ecfdf5;border-radius:8px">
        <strong style="color:#065f46">Totale jaarlijkse besparing: €${Math.round(data.totalAnnualSaving).toLocaleString('nl-NL')}/jr</strong><br/>
        <span style="color:#059669">20-jaar netto: €${Math.round(data.twentyYearNet).toLocaleString('nl-NL')}</span>
      </div>
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!validateRequest(body)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const html = formatEmailHtml(body)

    await getResend().emails.send({
      from: 'Groene Woning <onboarding@resend.dev>',
      to: 'info@ciaglobio.net',
      subject: `Offerteaanvraag — ${body.postcode} — ${body.upgrades.length} maatregelen`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Quote submission error:', error)
    return NextResponse.json({ error: 'Failed to send quote request' }, { status: 500 })
  }
}
