import AddressInput from '@/components/AddressInput'
import LanguageToggle from '@/components/LanguageToggle'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <header className="flex justify-end p-4">
        <LanguageToggle />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        <div className="w-full max-w-xl text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
              <span className="text-white text-sm">🏠</span>
            </div>
            <span className="text-sm font-semibold text-stone-500 tracking-widest uppercase">
              Home Sustainability
            </span>
          </div>

          <h1 className="text-4xl font-bold text-stone-900 leading-tight">
            Wat levert verduurzaming<br />jouw woning op?
          </h1>

          <p className="text-lg text-stone-500 max-w-md mx-auto leading-relaxed">
            Voer je adres in en ontdek welke maatregelen het meest opleveren —
            eerlijk, onafhankelijk en zonder verborgen agenda.
          </p>

          <AddressInput />

          <p className="text-xs text-stone-400 pt-2">
            We slaan geen persoonlijke gegevens op. Alle berekeningen zijn gebaseerd op openbare bronnen.
          </p>
        </div>
      </div>
    </main>
  )
}
