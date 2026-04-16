export default function ResultsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Jouw aanbevelingen</h1>
        <p className="text-gray-500 mb-8">
          Gesorteerd op jaarlijkse besparing.
        </p>
        {/* SortControls + UpgradeCards go here — built in next screen */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
          Resultaten worden hier getoond...
        </div>
      </div>
    </main>
  )
}
