/**
 * Sistema de toasts global — módulo pub/sub sin dependencia de React Context.
 *
 * Cualquier componente del panel puede empujar un toast con:
 *   import { pushToast } from '@/lib/toast'
 *   pushToast({ tone: 'ok', text: 'Mesa reasignada' })
 *
 * El <Toaster /> montado en el layout del dashboard se suscribe y dibuja la
 * pila. Múltiples toasts conviven (stack hasta 3), cada uno con su propio
 * timer. El más viejo se auto-desaloja cuando llega un 4to.
 */

export type ToastTone = 'ok' | 'error' | 'info'

export interface ToastInput {
  tone: ToastTone
  text: string
  /** Subtítulo opcional — 1 línea extra en gris */
  hint?: string
  /** Duración en ms (default 2400) */
  duration?: number
}

export interface Toast extends ToastInput {
  id: number
  duration: number
  createdAt: number
}

type Listener = (toasts: Toast[]) => void

const MAX_STACK = 3
const DEFAULT_DURATION = 2400

let nextId = 1
let toasts: Toast[] = []
const listeners = new Set<Listener>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit() {
  for (const l of listeners) l([...toasts])
}

function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  const timer = timers.get(id)
  if (timer) { clearTimeout(timer); timers.delete(id) }
  emit()
}

export function pushToast(input: ToastInput): number {
  const id = nextId++
  const toast: Toast = {
    id,
    tone: input.tone,
    text: input.text,
    hint: input.hint,
    duration: input.duration ?? DEFAULT_DURATION,
    createdAt: Date.now(),
  }
  toasts = [...toasts, toast]
  // Desalojar el más viejo si pasamos el tope
  while (toasts.length > MAX_STACK) {
    const dropped = toasts.shift()!
    const timer = timers.get(dropped.id)
    if (timer) { clearTimeout(timer); timers.delete(dropped.id) }
  }
  timers.set(id, setTimeout(() => removeToast(id), toast.duration))
  emit()
  return id
}

export function dismissToast(id: number) {
  removeToast(id)
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener([...toasts])
  return () => { listeners.delete(listener) }
}
