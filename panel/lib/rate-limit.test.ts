import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit } from './rate-limit'

function makeRequest(ip = '1.2.3.4') {
  return {
    headers: new Headers({ 'x-forwarded-for': ip }),
  } as unknown as import('next/server').NextRequest
}

describe('rateLimit (memory fallback)', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('allows up to limit requests in window', async () => {
    const req = makeRequest('10.0.0.1')
    for (let i = 0; i < 5; i++) {
      const r = await rateLimit(req, { key: 'test-allow', limit: 5, windowSec: 60 })
      expect(r.ok).toBe(true)
    }
  })

  it('blocks after exceeding limit', async () => {
    const req = makeRequest('10.0.0.2')
    const opts = { key: 'test-block', limit: 3, windowSec: 60 }
    for (let i = 0; i < 3; i++) await rateLimit(req, opts)
    const blocked = await rateLimit(req, opts)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('isolates buckets by identifier', async () => {
    const opts = { key: 'test-iso', limit: 2, windowSec: 60 }
    await rateLimit(makeRequest('10.0.0.3'), opts)
    await rateLimit(makeRequest('10.0.0.3'), opts)
    const blockedA = await rateLimit(makeRequest('10.0.0.3'), opts)
    const allowedB = await rateLimit(makeRequest('10.0.0.4'), opts)
    expect(blockedA.ok).toBe(false)
    expect(allowedB.ok).toBe(true)
  })

  it('uses identifier override when provided', async () => {
    const req = makeRequest('10.0.0.5')
    const r1 = await rateLimit(req, { key: 'test-id', limit: 1, windowSec: 60, identifier: 'user-a' })
    const r2 = await rateLimit(req, { key: 'test-id', limit: 1, windowSec: 60, identifier: 'user-b' })
    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)
  })
})
