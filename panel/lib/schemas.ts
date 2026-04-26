/* UnToque · Schemas Zod compartidos para validación de bodies de API.
 *
 * Uso típico:
 *   const body = parseBody(request, NewReservationSchema)
 *   if (!body.ok) return body.response
 *   // body.data es type-safe
 */

import { z } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'

/* ─── Helpers ──────────────────────────────────────────────── */

const nonEmptyString = z.string().trim().min(1)
const optionalString = z.string().trim().min(1).optional()
const phone = z
  .string()
  .trim()
  .regex(/^[\d+\s()-]{8,20}$/, 'Teléfono inválido')
  .optional()
  .nullable()
const hhmm = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')

/* ─── Reservation ──────────────────────────────────────────── */

export const NewReservationSchema = z.object({
  venue_id: z.string().uuid(),
  table_id: z.string().uuid(),
  date: isoDate,
  time_slot: hhmm,
  party_size: z.number().int().min(1).max(50),
  duration_minutes: z.number().int().min(15).max(480).default(90),
  guest_name: nonEmptyString.max(120),
  guest_phone: phone,
  customer_notes: optionalString.nullable(),
  staff_notes: optionalString.nullable(),
  walked_in: z.boolean().default(false),
})

export const PatchReservationSchema = z
  .object({
    table_id: z.string().uuid().optional(),
    time_slot: hhmm.optional(),
    party_size: z.number().int().min(1).max(50).optional(),
    duration_minutes: z.number().int().min(15).max(480).optional(),
    guest_name: nonEmptyString.max(120).optional(),
    guest_phone: phone,
    customer_notes: z.string().nullable().optional(),
    staff_notes: z.string().nullable().optional(),
    status: z
      .enum(['pending_payment', 'confirmed', 'checked_in', 'finished', 'cancelled', 'no_show'])
      .optional(),
    cancel_reason: z.string().nullable().optional(),
    cancelled_by: z.enum(['venue', 'customer', 'system']).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Patch vacío' })

/* ─── Waitlist ─────────────────────────────────────────────── */

export const NewWaitlistSchema = z.object({
  guest_name: nonEmptyString.max(120),
  guest_phone: phone,
  party_size: z.number().int().min(1).max(50),
  notes: z.string().max(500).optional().nullable(),
  estimated_minutes: z.number().int().min(0).max(480).optional().nullable(),
})

/* ─── Penalty ──────────────────────────────────────────────── */

export const NewPenaltySchema = z.object({
  reservation_id: z.string().uuid().nullable().optional(),
  guest_name: z.string().max(120).nullable().optional(),
  guest_phone: phone,
  kind: z.enum(['no_show', 'late_cancel', 'repeat_offender']),
  amount_ars: z.number().int().min(0).max(10_000_000),
  reason: z.string().max(500).nullable().optional(),
  charged: z.boolean(),
})

/* ─── Push Subscribe ──────────────────────────────────────── */

export const PushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
  user_agent: z.string().max(500).optional(),
})

/* ─── Review response ─────────────────────────────────────── */

export const ReviewResponseSchema = z.object({
  body: nonEmptyString.max(1000),
})

/* ─── Venue Images ─────────────────────────────────────────── */

export const VenueImageKindSchema = z.enum(['logo', 'cover', 'gallery'])

export const NewVenueImageSchema = z.object({
  kind: VenueImageKindSchema,
  alt_text: z.string().min(1, 'Alt text obligatorio (accesibilidad)').max(200),
  // upload viene como FormData, los demás campos los infiere el server
})

export const UpdateVenueImageSchema = z
  .object({
    alt_text: z.string().min(1).max(200).optional(),
    sort_order: z.number().int().min(0).max(99).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Patch vacío' })

export const ReorderVenueImagesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(12),
})

/* ─── Helpers de uso ──────────────────────────────────────── */

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }

/**
 * Parsea el body JSON de un request y lo valida contra el schema dado.
 * Si falla, devuelve un NextResponse 400 con detalle de errores.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T,
): Promise<ParseResult<z.infer<T>>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 },
      ),
    }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Validación falló',
          issues: result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 },
      ),
    }
  }
  return { ok: true, data: result.data }
}
