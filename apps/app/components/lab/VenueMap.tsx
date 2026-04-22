'use client'

/**
 * Mini mapa de un venue usando OpenStreetMap (sin API key) + botón
 * 'Cómo llegar' que abre Google Maps / Apple Maps según dispositivo.
 *
 * Cuando tengamos Google Maps API key, reemplazar el iframe por un
 * MapContainer de @react-google-maps/api con el mismo bbox.
 */

interface Props {
  name: string
  address: string
  coords: { lat: number; lng: number }
}

function buildOSMUrl(lat: number, lng: number): string {
  // Bounding box de ~400m alrededor del punto
  const d = 0.0035
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

function buildDirectionsUrl(lat: number, lng: number, address: string): string {
  const q = encodeURIComponent(address)
  // Maps universal URL — abre Google Maps en Android/Desktop y Apple Maps en iOS
  // al tapear si el usuario tiene la app. iOS respeta el geo: fallback.
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${q}`
}

export function VenueMap({ name, address, coords }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[17px] font-bold text-tx">Dónde estamos</h2>
        <a
          href={buildDirectionsUrl(coords.lat, coords.lng, `${name}, ${address}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-c4
                     active:scale-95 transition-transform duration-[180ms]"
        >
          Cómo llegar
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M7 17L17 7M17 7H8M17 7v9"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-[var(--br)] bg-sf2">
        <iframe
          src={buildOSMUrl(coords.lat, coords.lng)}
          title={`Mapa de ${name}`}
          loading="lazy"
          className="w-full aspect-[16/9] min-h-[180px] block"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {/* Overlay con dirección */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm
                        rounded-lg p-2.5 border border-[var(--br)] shadow-sm">
          <p className="text-[13px] font-semibold text-tx truncate">{name}</p>
          <p className="text-[11px] text-tx2 truncate">{address}</p>
        </div>
      </div>

      <a
        href={buildDirectionsUrl(coords.lat, coords.lng, `${name}, ${address}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-c4 text-white font-bold text-[14px] py-3 px-4 rounded-md
                   flex items-center justify-center gap-2
                   active:scale-[0.98] transition-transform duration-[180ms]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 21s-7-6.6-7-12a7 7 0 1114 0c0 5.4-7 12-7 12z"
                stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        Abrir en Maps
      </a>
    </section>
  )
}
