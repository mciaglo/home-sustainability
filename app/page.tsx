import AddressInput from '@/components/AddressInput'
import LanguageToggle from '@/components/LanguageToggle'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-end p-4">
        <LanguageToggle />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        <div className="w-full max-w-xl text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏠</span>
            <span className="text-sm font-medium text-gray-500 tracking-wide uppercase">
              Home Sustainability
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Wat levert verduurzaming<br />jouw woning op?
          </h1>

          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Voer je adres in en ontdek welke maatregelen het meest opleveren —
            eerlijk, onafhankelijk en zonder verborgen agenda.
          </p>

          <AddressInput />

          <p className="text-xs text-gray-400 pt-2">
            We slaan geen persoonlijke gegevens op. Alle berekeningen zijn gebaseerd op openbare bronnen.
          </p>
        </div>
      </div>
    </main>
  )
}
