import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-stone-300">404</h1>
        <p className="text-stone-500">Deze pagina bestaat niet · This page doesn&apos;t exist</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl transition-colors"
        >
          ← Terug naar home / Back to home
        </Link>
      </div>
    </div>
  )
}
