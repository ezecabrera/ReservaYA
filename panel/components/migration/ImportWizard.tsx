'use client'

import { useState, useMemo, useRef } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Select } from '@/components/ui/Field'
import { parseCsv, suggestMapping, type ParsedCsv } from '@/lib/csv'
import { IMPORT_SCHEMAS, type ImportEntity } from '@/lib/import-schemas'
import { applyPreset, getPreset, type ImportSource } from '@/lib/import-presets'

interface ImportWizardProps {
  open: boolean
  onClose: () => void
  /** Notifica al parent de un import exitoso (para refrescar vistas) */
  onCommitted?: (entity: ImportEntity, stats: CommitStats) => void
}

interface CommitStats {
  total: number
  inserted: number
  updated: number
  skipped: number
  failed: Array<{ row: number; error: string }>
}

type Step = 'entity' | 'upload' | 'map' | 'preview' | 'running' | 'report'

export function ImportWizard({ open, onClose, onCommitted }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('entity')
  const [entity, setEntity] = useState<ImportEntity>('tables')
  const [source, setSource] = useState<ImportSource>('untoque')
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<Record<string, string | null>>({})
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<CommitStats | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const schema = IMPORT_SCHEMAS[entity]

  function resetAll() {
    setStep('entity')
    setEntity('tables')
    setSource('untoque')
    setParsed(null)
    setMapping({})
    setFileName(null)
    setError(null)
    setStats(null)
  }

  async function handleFile(file: File) {
    setError(null)
    setFileName(file.name)
    const text = await file.text()
    const parsed = parseCsv(text)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setError('El archivo está vacío o no pudo parsearse')
      return
    }
    setParsed(parsed)
    // Si hay preset para este (source, entity), úsalo. Si no, fuzzy match.
    const preset = getPreset(source, entity)
    const initialMapping = preset
      ? applyPreset(preset, parsed.headers, schema.fields)
      : suggestMapping(parsed.headers, schema.fields)
    // Si el preset dejó campos sin mapear, completá con suggest
    if (preset) {
      const suggested = suggestMapping(parsed.headers, schema.fields)
      for (const k of Object.keys(initialMapping)) {
        if (!initialMapping[k] && suggested[k]) initialMapping[k] = suggested[k]
      }
    }
    setMapping(initialMapping)
    setStep('map')
  }

  const mappedRows = useMemo(() => {
    if (!parsed) return []
    return parsed.rows.map((row) => {
      const out: Record<string, string> = {}
      for (const field of schema.fields) {
        const src = mapping[field.id]
        out[field.id] = src ? row[src] ?? '' : ''
      }
      return out
    })
  }, [parsed, mapping, schema])

  const missingRequired = useMemo(
    () => schema.fields.filter((f) => f.required && !mapping[f.id]),
    [schema, mapping],
  )

  async function handleCommit() {
    if (!parsed || missingRequired.length > 0) return
    setStep('running')
    try {
      const res = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entity, source, rows: mappedRows }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Error al importar')
      }
      setStats(data)
      setStep('report')
      onCommitted?.(entity, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStep('preview')
    }
  }

  const title = step === 'report' && stats
    ? `Import completo · ${stats.inserted + stats.updated} ok`
    : 'Importar desde CSV'

  const subtitle = {
    entity: 'Elegí qué tipo de datos vas a importar',
    upload: `${schema.label} — subí un archivo CSV exportado`,
    map: `${schema.label} — mapeá las columnas del CSV a UnToque`,
    preview: `${schema.label} — revisá antes de importar (${parsed?.rows.length ?? 0} filas)`,
    running: 'Importando…',
    report: 'Resultado del import',
  }[step]

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        onClose()
        setTimeout(resetAll, 240) // reset post-animación
      }}
      title={title}
      subtitle={subtitle}
      primaryAction={
        step === 'report' ? (
          <button
            type="button"
            onClick={() => {
              onClose()
              setTimeout(resetAll, 240)
            }}
            className="h-9 px-4 rounded-full font-semibold text-[13px]
                       bg-[var(--wine)] text-white border border-[var(--wine-soft)]
                       hover:bg-[var(--wine-soft)] transition-colors"
          >
            Listo
          </button>
        ) : undefined
      }
    >
      <StepIndicator step={step} />

      {step === 'entity' && (
        <div className="space-y-3 mt-2">
          {(['tables', 'reservations', 'customers'] as ImportEntity[]).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEntity(e)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors
                          ${entity === e
                            ? 'border-[var(--wine-soft)] bg-[var(--wine-soft)]/10'
                            : 'border-[var(--ink-line-2)] bg-[var(--ink-3)] hover:border-[var(--ink-text)]/20'}`}
            >
              <p className="text-[14px] font-bold text-[var(--ink-text)]">
                {IMPORT_SCHEMAS[e].label}
              </p>
              <p className="text-[11px] text-[var(--ink-text)]/55 mt-0.5">
                {entityHint(e)}
              </p>
            </button>
          ))}

          <div className="pt-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-text)]/60 mb-1.5">
              Origen de los datos
            </label>
            <Select value={source} onChange={(e) => setSource(e.target.value as ImportSource)}>
              <option value="untoque">UnToque</option>
              <option value="thefork">TheFork</option>
              <option value="maxirest">Maxirest</option>
              <option value="fudo">Fudo</option>
              <option value="google-sheets">Google Sheets</option>
              <option value="excel">Excel</option>
              <option value="manual">Manual</option>
            </Select>
            {(() => {
              const preset = getPreset(source, entity)
              if (!preset?.exportTip) return null
              return (
                <p className="text-[11px] text-[var(--ink-text)]/60 mt-1.5 leading-relaxed">
                  💡 {preset.exportTip}
                </p>
              )
            })()}
          </div>

          <button
            type="button"
            onClick={() => setStep('upload')}
            className="w-full h-11 mt-3 rounded-xl font-bold text-[14px]
                       bg-[var(--wine)] text-white hover:bg-[var(--wine-soft)]
                       transition-colors"
          >
            Continuar →
          </button>
        </div>
      )}

      {step === 'upload' && (
        <div className="mt-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
            className="border-2 border-dashed border-[var(--ink-line-2)] rounded-2xl
                       p-8 text-center cursor-pointer hover:border-[var(--wine-soft)]
                       transition-colors"
          >
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mx-auto mb-3">
              <path
                d="M12 15V3m0 0L8 7m4-4l4 4M5 15v4a2 2 0 002 2h10a2 2 0 002-2v-4"
                stroke="var(--wine-soft)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[14px] font-bold text-[var(--ink-text)]">
              Arrastrá tu CSV acá o hacé click
            </p>
            <p className="text-[11px] text-[var(--ink-text)]/55 mt-1">
              Soportamos comas, punto y coma, o tabulador como delimitador
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />

          {error && (
            <div className="mt-3 rounded-xl px-4 py-2.5 bg-[var(--wine)]/15 border border-[var(--wine-soft)]/30 text-[12px] text-[var(--wine-soft)]">
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setStep('entity')}
              className="h-10 px-4 rounded-xl text-[13px] font-semibold
                         text-[var(--ink-text)]/65 hover:text-[var(--ink-text)]
                         bg-[var(--ink-3)] border border-[var(--ink-line-2)]"
            >
              ← Atrás
            </button>
          </div>
        </div>
      )}

      {step === 'map' && parsed && (
        <div className="mt-2">
          <div className="space-y-2">
            {schema.fields.map((field) => (
              <div
                key={field.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)] items-center gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[var(--ink-text)]/80 truncate">
                    {field.label}
                    {field.required && <span className="text-[var(--wine-soft)] ml-1">*</span>}
                  </p>
                  {field.hint && (
                    <p className="text-[10px] text-[var(--ink-text)]/40 truncate">
                      {field.hint}
                    </p>
                  )}
                </div>
                <span className="text-[var(--ink-text)]/30 text-[16px]">←</span>
                <Select
                  value={mapping[field.id] ?? ''}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, [field.id]: e.target.value || null }))
                  }
                >
                  <option value="">— ignorar —</option>
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>
              </div>
            ))}
          </div>

          {missingRequired.length > 0 && (
            <div className="mt-3 rounded-xl px-4 py-2.5 bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[12px] text-[#F6D48A]">
              Faltan requeridos: {missingRequired.map((f) => f.label).join(', ')}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="h-10 px-4 rounded-xl text-[13px] font-semibold
                         text-[var(--ink-text)]/65 hover:text-[var(--ink-text)]
                         bg-[var(--ink-3)] border border-[var(--ink-line-2)]"
            >
              ← Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep('preview')}
              disabled={missingRequired.length > 0}
              className="flex-1 h-10 rounded-xl text-[13px] font-bold
                         bg-[var(--wine)] text-white hover:bg-[var(--wine-soft)]
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              Vista previa →
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && parsed && (
        <div className="mt-2">
          <div className="rounded-xl border border-[var(--ink-line-2)] overflow-hidden">
            <div className="max-h-[320px] overflow-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-[var(--ink-3)] sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-text)]/55">
                      #
                    </th>
                    {schema.fields
                      .filter((f) => mapping[f.id])
                      .map((f) => (
                        <th
                          key={f.id}
                          className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ink-text)]/55"
                        >
                          {f.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-[var(--ink-line)]">
                      <td className="px-2 py-1.5 text-[var(--ink-text)]/40 font-mono">
                        {i + 1}
                      </td>
                      {schema.fields
                        .filter((f) => mapping[f.id])
                        .map((f) => (
                          <td
                            key={f.id}
                            className="px-2 py-1.5 text-[var(--ink-text)]/80 truncate max-w-[140px]"
                            title={row[f.id]}
                          >
                            {row[f.id] || <span className="text-[var(--ink-text)]/20">—</span>}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-[var(--ink-text)]/45 mt-2">
            Mostrando {Math.min(10, mappedRows.length)} de {mappedRows.length} filas
          </p>

          {error && (
            <div className="mt-3 rounded-xl px-4 py-2.5 bg-[var(--wine)]/15 border border-[var(--wine-soft)]/30 text-[12px] text-[var(--wine-soft)]">
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setStep('map')}
              className="h-10 px-4 rounded-xl text-[13px] font-semibold
                         text-[var(--ink-text)]/65 hover:text-[var(--ink-text)]
                         bg-[var(--ink-3)] border border-[var(--ink-line-2)]"
            >
              ← Atrás
            </button>
            <button
              type="button"
              onClick={handleCommit}
              className="flex-1 h-10 rounded-xl text-[13px] font-bold
                         bg-[var(--wine)] text-white hover:bg-[var(--wine-soft)]
                         transition-colors"
            >
              Importar {mappedRows.length} filas
            </button>
          </div>
        </div>
      )}

      {step === 'running' && (
        <div className="py-12 text-center">
          <span
            className="inline-block w-8 h-8 rounded-full border-2 border-[var(--wine-soft)]/40 border-t-[var(--wine-soft)] animate-spin"
            aria-label="Importando"
          />
          <p className="text-[13px] text-[var(--ink-text)]/70 mt-3">
            Procesando {mappedRows.length} filas…
          </p>
        </div>
      )}

      {step === 'report' && stats && (
        <div className="mt-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Insertadas" value={stats.inserted} tone="olive" />
            <StatBox label="Actualizadas" value={stats.updated} tone="gold" />
            <StatBox label="Omitidas" value={stats.skipped} tone="neutral" />
            <StatBox label="Fallidas" value={stats.failed.length} tone="wine" />
          </div>

          {stats.failed.length > 0 && (
            <details className="rounded-xl border border-[var(--wine-soft)]/30 bg-[var(--wine)]/5">
              <summary className="px-4 py-2.5 text-[12px] font-bold text-[var(--wine-soft)] cursor-pointer">
                Ver {stats.failed.length} error{stats.failed.length !== 1 ? 'es' : ''}
              </summary>
              <ul className="px-4 pb-3 space-y-1 max-h-[200px] overflow-auto">
                {stats.failed.slice(0, 50).map((f, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-[var(--ink-text)]/70 font-mono"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Fila {f.row}: {f.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </BottomSheet>
  )
}

function entityHint(e: ImportEntity): string {
  switch (e) {
    case 'tables':       return 'Mesas + zonas. Ideal primero (desbloquea reservas)'
    case 'reservations': return 'Reservas futuras o historial. Requiere mesas ya cargadas'
    case 'customers':    return 'Listado de clientes. Se materializan vía reservas'
  }
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ['entity', 'upload', 'map', 'preview', 'report']
  const current = steps.indexOf(step === 'running' ? 'preview' : step)
  return (
    <div className="flex items-center gap-1.5 mb-4" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={5}>
      {steps.map((s, i) => (
        <div
          key={s}
          className="flex-1 h-1 rounded-full transition-colors"
          style={{
            background: i <= current ? 'var(--wine-soft)' : 'var(--ink-line-2)',
          }}
        />
      ))}
    </div>
  )
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'olive' | 'gold' | 'wine' | 'neutral'
}) {
  const colors = {
    olive:   { bg: 'rgba(79, 138, 95, 0.15)',  border: 'rgba(79, 138, 95, 0.35)',  text: '#8BC79B' },
    gold:    { bg: 'rgba(201, 145, 48, 0.15)', border: 'rgba(201, 145, 48, 0.35)', text: '#E0BB66' },
    wine:    { bg: 'rgba(161, 49, 67, 0.15)',  border: 'rgba(161, 49, 67, 0.35)',  text: '#F3D0D7' },
    neutral: { bg: 'rgba(243, 240, 234, 0.05)', border: 'rgba(243, 240, 234, 0.15)', text: 'rgba(243, 240, 234, 0.65)' },
  }[tone]
  return (
    <div
      className="rounded-xl border px-3 py-3 text-center"
      style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
    >
      <p
        className="text-[22px] font-bold leading-none tabular-nums"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
        {label}
      </p>
    </div>
  )
}
