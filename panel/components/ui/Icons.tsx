/**
 * Iconografía custom hand-drawn — trazos imperfectos con currentColor.
 *
 * Uso:
 *   <IconWineGlass className="w-7 h-7" />
 *   <IconPlateCutlery className="w-7 h-7 text-olive" />
 *
 * Criterios de diseño:
 *   - Stroke 1.6 con linecap=round + linejoin=round: da el "trazo a mano"
 *   - fill=none excepto highlights pequeños para evitar rigidez geométrica
 *   - Paths cortos, asimetrías intencionales (ej. copa con curva leve)
 *   - Heredan color del padre (currentColor) para reuso cross-theme
 *
 * Viewbox 24x24 para matchear la API de lucide/heroicons.
 */

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

function Base({ size = 24, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/**
 * Copa de vino — empty state "sin reservas", chip VIP.
 * Asimetría deliberada en la boca de la copa, pie con ondulación.
 */
export function IconWineGlass(props: IconProps) {
  return (
    <Base {...props}>
      {/* Boca de la copa — elipse irregular */}
      <path d="M7.2 3.5 C7.4 3 16.6 3 16.8 3.5" />
      {/* Cuerpo cónico — curva suave hacia el tallo */}
      <path d="M7.2 3.5 C6.8 7 7.8 10.5 12 11.2 C16.2 10.5 17.2 7 16.8 3.5" />
      {/* Tallo */}
      <path d="M12 11.2 V18" />
      {/* Pie */}
      <path d="M8 20.5 C8.5 19.2 15.5 19.2 16 20.5" />
      {/* Highlight del líquido — gota asimétrica */}
      <path d="M9.2 5 C10 6.2 11.5 6.4 12.5 5.6" strokeOpacity="0.5" />
    </Base>
  )
}

/**
 * Plato + cubiertos — empty state CRM, chip habitué.
 * Plato vista cenital con 3/4 de arco, tenedor y cuchillo a los costados.
 */
export function IconPlateCutlery(props: IconProps) {
  return (
    <Base {...props}>
      {/* Plato — círculo externo */}
      <circle cx="12" cy="12" r="6.2" />
      {/* Anillo interno decorativo */}
      <circle cx="12" cy="12" r="4.2" strokeOpacity="0.45" />
      {/* Tenedor izquierdo */}
      <path d="M4 5 V10.5" />
      <path d="M3 5 V7.5" strokeOpacity="0.65" />
      <path d="M5 5 V7.5" strokeOpacity="0.65" />
      <path d="M4 10.5 V20" />
      {/* Cuchillo derecho */}
      <path d="M20 5 C20.3 8 20 11 20 11 L20 20" />
    </Base>
  )
}

/**
 * Silla — empty state "mesas libres", disponibilidad.
 * Respaldo alto, asiento, dos patas visibles. Perfil levemente inclinado.
 */
export function IconChair(props: IconProps) {
  return (
    <Base {...props}>
      {/* Respaldo */}
      <path d="M7.5 3.5 V13" />
      <path d="M7.5 5.5 H14.5" strokeOpacity="0.6" />
      <path d="M7.5 8 H14.5" strokeOpacity="0.6" />
      <path d="M14.5 3.5 V13" />
      {/* Asiento (vista 3/4) */}
      <path d="M6 13 H16.2 L17 15 H5.5 Z" />
      {/* Patas */}
      <path d="M6.5 15 V20.5" />
      <path d="M16 15 V20.5" />
      {/* Travesaño inferior */}
      <path d="M6.5 18.5 H16" strokeOpacity="0.55" />
    </Base>
  )
}

/**
 * Reloj de arena — tiempo de espera en waitlist.
 * Contornos cóncavos, granos en ambas cámaras, tapas superior e inferior.
 */
export function IconHourglass(props: IconProps) {
  return (
    <Base {...props}>
      {/* Tapa superior */}
      <path d="M6 3.5 H18" />
      {/* Tapa inferior */}
      <path d="M6 20.5 H18" />
      {/* Cuerpo izquierdo */}
      <path d="M7 3.5 C7 8 11 11 11 12 C11 13 7 16 7 20.5" />
      {/* Cuerpo derecho */}
      <path d="M17 3.5 C17 8 13 11 13 12 C13 13 17 16 17 20.5" />
      {/* Arena acumulada abajo */}
      <path d="M8.5 19 C9.5 17.8 14.5 17.8 15.5 19" strokeOpacity="0.7" />
      {/* Hilo central de arena */}
      <path d="M12 12 V14.5" strokeOpacity="0.5" />
    </Base>
  )
}

/**
 * Book abierto — historial de reservas, CRM detail.
 * Dos páginas abiertas con líneas sutiles, lomo central.
 */
export function IconOpenBook(props: IconProps) {
  return (
    <Base {...props}>
      {/* Página izquierda — curva leve */}
      <path d="M3.5 5.5 C6 5 9.5 5.2 12 7 V20 C9.5 18.2 6 18 3.5 18.5 Z" />
      {/* Página derecha */}
      <path d="M20.5 5.5 C18 5 14.5 5.2 12 7 V20 C14.5 18.2 18 18 20.5 18.5 Z" />
      {/* Líneas de texto izquierda */}
      <path d="M5.5 9 H9.5" strokeOpacity="0.45" />
      <path d="M5.5 11.5 H10" strokeOpacity="0.45" />
      <path d="M5.5 14 H9" strokeOpacity="0.45" />
      {/* Líneas de texto derecha */}
      <path d="M14 9 H18" strokeOpacity="0.45" />
      <path d="M14 11.5 H18.5" strokeOpacity="0.45" />
      <path d="M14 14 H17.5" strokeOpacity="0.45" />
    </Base>
  )
}
