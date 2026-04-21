'use client'

import { useLocale } from '@/lib/locale-context'
import LanguageToggle from '@/components/LanguageToggle'

export default function PrivacyPage() {
  const { locale } = useLocale()
  const nl = locale === 'nl'

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/quote" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            ← {nl ? 'Terug' : 'Back'}
          </a>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-stone-900">
          {nl ? 'Privacybeleid' : 'Privacy policy'}
        </h1>
        <p className="text-sm text-stone-500">
          {nl ? 'Laatst bijgewerkt: april 2026' : 'Last updated: April 2026'}
        </p>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 text-sm text-stone-600 leading-relaxed">

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">
              {nl ? 'Wat we verzamelen' : 'What we collect'}
            </h2>
            <p>
              {nl
                ? 'Wanneer je een offerteaanvraag indient, verzamelen we uitsluitend:'
                : 'When you submit a quote request, we collect only:'}
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{nl ? 'Je naam, e-mailadres en telefoonnummer' : 'Your name, email address, and phone number'}</li>
              <li>{nl ? 'Je postcode (Niet je straatadres)' : 'Your postcode (Not your street address)'}</li>
              <li>{nl ? 'Je geselecteerde maatregelen en geschatte kosten' : 'Your selected upgrades and estimated costs'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">
              {nl ? 'Wat we NIET verzamelen' : 'What we do NOT collect'}
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>{nl ? 'Je straatadres of huisnummer' : 'Your street address or house number'}</li>
              <li>{nl ? 'Cookies of trackinggegevens' : 'Cookies or tracking data'}</li>
              <li>{nl ? 'Financiële gegevens' : 'Financial information'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">
              {nl ? 'Waarom we het verzamelen' : 'Why we collect it'}
            </h2>
            <p>
              {nl
                ? 'Uitsluitend om je te verbinden met maximaal 3 gecertificeerde installateurs per maatregel in jouw regio, zodat zij een offerte kunnen uitbrengen voor de door jou geselecteerde maatregelen.'
                : 'Solely to connect you with up to 3 certified installers per upgrade in your area, so they can provide a quote for the upgrades you selected.'}
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">
              {nl ? 'Wie ziet je gegevens' : 'Who sees your data'}
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>{nl ? 'De platformbeheerder (Ciaglo Bio) — om je te matchen met installateurs' : 'The platform operator (Ciaglo Bio) — to match you with installers'}</li>
              <li>{nl ? 'Maximaal 3 installateurs per maatregel in jouw regio' : 'Up to 3 installers per upgrade in your area'}</li>
            </ul>
            <p className="mt-2">
              {nl
                ? 'Je gegevens worden uitsluitend gedeeld met de installatiebedrijven die je offerte uitbrengen. We verkopen je gegevens niet aan andere partijen en gebruiken ze niet voor marketing.'
                : 'Your data is only shared with the installation companies providing your quote. We do not sell your data to other parties or use it for marketing.'}
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">
              {nl ? 'Hoe lang we het bewaren' : 'How long we keep it'}
            </h2>
            <p>
              {nl
                ? 'Je gegevens worden niet opgeslagen in een database. De offerteaanvraag wordt per e-mail verwerkt. E-mailrecords worden maximaal 90 dagen bewaard en daarna verwijderd.'
                : 'Your data is not stored in a database. The quote request is processed via email. Email records are retained for a maximum of 90 days, then deleted.'}
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">
              {nl ? 'Je rechten' : 'Your rights'}
            </h2>
            <p>
              {nl
                ? 'Op grond van de AVG (GDPR) heb je het recht om:'
                : 'Under the GDPR, you have the right to:'}
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{nl ? 'Je toestemming op elk moment in te trekken' : 'Withdraw your consent at any time'}</li>
              <li>{nl ? 'Verwijdering van je gegevens te verzoeken' : 'Request deletion of your data'}</li>
              <li>{nl ? 'Inzage te vragen in welke gegevens we over je hebben' : 'Request access to what data we hold about you'}</li>
            </ul>
            <p className="mt-2">
              {nl
                ? 'Neem hiervoor contact op via '
                : 'Contact us at '}
              <a href="mailto:info@ciaglobio.net" className="text-emerald-700 underline">info@ciaglobio.net</a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">
              {nl ? 'Cookies' : 'Cookies'}
            </h2>
            <p>
              {nl
                ? 'Deze website gebruikt geen cookies. Alle berekeningen worden uitgevoerd in je browser via sessiegegevens, die automatisch worden gewist wanneer je het tabblad sluit.'
                : 'This website does not use cookies. All calculations are performed in your browser using session data, which is automatically cleared when you close the tab.'}
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">
              {nl ? 'Contact' : 'Contact'}
            </h2>
            <p>
              {nl ? 'Vragen over dit privacybeleid? Neem contact op via ' : 'Questions about this privacy policy? Contact us at '}
              <a href="mailto:info@ciaglobio.net" className="text-emerald-700 underline">info@ciaglobio.net</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
