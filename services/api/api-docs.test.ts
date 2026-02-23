import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'

describe('API Documentation', () => {
  let app: Hono

  beforeEach(() => {
    // Import the documented API
    const { default: appModule } = require('../src/api-docs')
    app = appModule
  })

  describe('OpenAPI Documentation', () => {
    it('should serve OpenAPI spec at /doc', async () => {
      const res = await app.request('/doc')
      expect(res.status).toBe(200)
      
      const spec = await res.json()
      expect(spec).toHaveProperty('openapi')
      expect(spec).toHaveProperty('info')
      expect(spec).toHaveProperty('paths')
      expect(spec.info.title).toBe('NeoCode API')
    })

    it('should serve Swagger UI at /swagger', async () => {
      const res = await app.request('/swagger')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
    })

    it('should include health endpoint in documentation', async () => {
      const res = await app.request('/doc')
      const spec = await res.json()
      
      expect(spec.paths).toHaveProperty('/health')
      expect(spec.paths['/health']).toHaveProperty('get')
    })

    it('should include GitHub webhook endpoint in documentation', async () => {
      const res = await app.request('/doc')
      const spec = await res.json()
      
      expect(spec.paths).toHaveProperty('/github/webhook')
      expect(spec.paths['/github/webhook']).toHaveProperty('post')
    })
  })

  describe('Documented Endpoints', () => {
    it('should maintain health endpoint functionality', async () => {
      const res = await app.request('/health')
      expect(res.status).toBe(200)
      
      const body = await res.json()
      expect(body).toHaveProperty('status')
      expect(body.status).toBe('ok')
      expect(body).toHaveProperty('timestamp')
    })

    it('should handle GitHub webhook with documentation', async () => {
      const payload = {
        zen: 'Test webhook',
        hook_id: 12345
      }

      const res = await app.request('/github/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect([200, 401]).toContain(res.status)
    })
  })
})
