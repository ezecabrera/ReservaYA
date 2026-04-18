/**
 * Template del dashboard — re-montado en cada cambio de ruta.
 *
 * Next.js App Router: layout.tsx persiste entre navegaciones, pero
 * template.tsx se vuelve a montar con cada push/replace. Usamos esa
 * semántica para reproducir el crossfade .view-enter ya definido en
 * globals (viewIn keyframe) al saltar entre /dashboard, /dashboard/
 * reservas, /dashboard/crm, etc.
 *
 * Respetamos prefers-reduced-motion gracias a la media query del .view-enter.
 */

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="view-enter">{children}</div>
}
