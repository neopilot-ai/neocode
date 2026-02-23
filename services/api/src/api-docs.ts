import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'

const app = new OpenAPIHono()

// Example API route with OpenAPI documentation
app.openapi(
  {
    method: 'get',
    path: '/health',
    responses: {
      200: {
        description: 'Health check response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  }
)

// GitHub webhook endpoint
app.openapi(
  {
    method: 'post',
    path: '/github/webhook',
    description: 'Handle GitHub webhooks',
    request: {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                zen: { type: 'string' },
                hook_id: { type: 'number' }
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Webhook processed successfully'
      },
      401: {
        description: 'Unauthorized'
      }
    }
  },
  (c) => {
    // Existing webhook logic here
    return c.json({ received: true })
  }
)

// Generate OpenAPI spec
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'NeoCode API',
    description: 'NeoCode API service for GitHub integrations and webhooks'
  },
  servers: [
    {
      url: 'https://api.neocode.ai',
      description: 'Production server'
    },
    {
      url: 'http://localhost:4096',
      description: 'Development server'
    }
  ]
})

// Serve Swagger UI
app.get('/swagger', swaggerUI({ url: '/doc' }))

export default app
