interface Props {
  address: string
  imageUrl?: string | null
}

export default function StreetViewStub({ address, imageUrl }: Props) {
  if (imageUrl) {
    return (
      <div className="w-full h-48 rounded-2xl overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`Street view of ${address}`} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className="w-full h-48 rounded-2xl bg-stone-100 flex flex-col items-center justify-center gap-2" role="img" aria-label={`Property at ${address}`}>
      <div className="text-4xl" aria-hidden="true">🏠</div>
      <p className="text-sm text-stone-400 text-center px-4">{address}</p>
    </div>
  )
}
