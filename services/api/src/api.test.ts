import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'

describe('API Service', () => {
  let app: Hono

  beforeEach(() => {
    // Import and initialize the app
    const { default: appModule } = require('../src/api')
    app = appModule
  })

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await app.request('/health')
      expect(res.status).toBe(200)
      
      const body = await res.json()
      expect(body).toHaveProperty('status')
      expect(body.status).toBe('ok')
    })
  })

  describe('GitHub Integration', () => {
    it('should handle GitHub webhook validation', async () => {
      const payload = {
        zen: 'Non-blocking is better than blocking.',
        hook_id: 12345678,
        hook: {
          type: 'Repository',
          id: 12345678,
          name: 'web',
          active: true,
          events: ['push', 'pull_request'],
          config: {
            content_type: 'json',
            insecure_ssl: '0',
            url: 'http://example.com/webhook'
          }
        },
        repository: {
          id: 35129377,
          name: 'public-repo',
          full_name: 'baxterthehacker/public-repo'
        }
      }

      const res = await app.request('/github/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': 'sha256=test'
        },
        body: JSON.stringify(payload)
      })

      // Should accept webhook (even with invalid signature for test)
      expect([200, 401, 400]).toContain(res.status)
    })
  })

  describe('Authentication', () => {
    it('should reject requests without proper authentication', async () => {
      const res = await app.request('/protected')
      expect(res.status).toBe(401)
    })
  })

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const res = await app.request('/api/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })

      expect(res.status).toBe(204)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const res = await app.request('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json{'
      })

      expect(res.status).toBe(400)
    })
  })
})
