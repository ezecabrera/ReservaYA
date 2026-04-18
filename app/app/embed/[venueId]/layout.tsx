/**
 * Layout dedicado del widget embebible.
 *
 * Objetivo: renderizar solo el flujo de reserva, sin BottomNav, sin chrome
 * del cliente. El venue pone un iframe en su Instagram/web → esto es lo que
 * ve el comensal.
 *
 * Fondo transparente: que adopte el color del sitio que lo embebe.
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-transparent">
      {children}
    </div>
  )
}
