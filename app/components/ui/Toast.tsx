'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, type = 'info', onDismiss, duration = 4500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'
  const iconColor = type === 'success' ? 'var(--olive)' : type === 'error' ? 'var(--wine)' : 'var(--olive)'

  return (
    <div
      className="fixed top-3 left-3 right-3 z-[100] flex items-center gap-3
                 bg-tx text-white rounded-2xl px-4 py-3.5
                 shadow-[0_8px_28px_rgba(0,0,0,0.25)] animate-slide-down"
      onClick={onDismiss}
    >
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                   text-[12px] font-black"
        style={{ background: iconColor, color: 'var(--tx)' }}
      >
        {icon}
      </span>
      <p className="text-[14px] font-medium flex-1">{message}</p>
    </div>
  )
}

/** Hook para mostrar toasts */
import { useState, useCallback } from 'react'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
  id: number
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback(
    (message: string, type: ToastState['type'] = 'info') => {
      setToast({ message, type, id: Date.now() })
    },
    [],
  )

  const dismiss = useCallback(() => setToast(null), [])

  return { toast, show, dismiss }
}
