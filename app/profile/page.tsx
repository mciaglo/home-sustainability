export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Klopt dit?</h1>
        <p className="text-gray-500 mb-8">
          We hebben je woningprofiel opgesteld op basis van openbare data. Pas aan wat niet klopt.
        </p>
        {/* HomeProfile component goes here — built in next screen */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
          Woningprofiel wordt hier geladen...
        </div>
      </div>
    </main>
  )
}
