---
name: api-integration
description: Handle API integrations and HTTP requests
---

## Use this when
- Integrating with external APIs
- Making HTTP requests to services
- Handling API authentication and rate limiting
- Processing API responses and errors

## Implementation

### Step 1: Setup HTTP Client
```typescript
// Use Bun's built-in HTTP capabilities
const response = await fetch(url, {
  method: 'GET|POST|PUT|DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify(data)
})
```

### Step 2: Handle Authentication
- API keys in headers
- OAuth tokens
- Basic authentication
- Custom auth schemes

### Step 3: Rate Limiting
- Implement exponential backoff
- Respect rate limit headers
- Queue requests when needed
- Handle 429 responses gracefully

### Step 4: Error Handling
- Network errors (timeout, connection issues)
- HTTP errors (4xx, 5xx responses)
- API-specific errors
- Validation errors

### Step 5: Response Processing
- Parse JSON responses
- Handle different content types
- Validate response schema
- Transform data as needed

## Best Practices

### Security
- Never hardcode API keys
- Use environment variables
- Validate all inputs
- Use HTTPS always

### Performance
- Cache responses when appropriate
- Use connection pooling
- Implement timeouts
- Compress requests/responses

### Reliability
- Implement retry logic
- Use circuit breakers
- Log errors appropriately
- Monitor API usage

## Common Patterns

### REST API Integration
```typescript
async function getFromAPI(endpoint: string, params?: Record<string, any>) {
  const url = new URL(`${BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}
```

### GraphQL Integration
```typescript
async function graphqlQuery(query: string, variables?: Record<string, any>) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GRAPHQL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  })
  
  const result = await response.json()
  
  if (result.errors) {
    throw new Error(result.errors[0].message)
  }
  
  return result.data
}
```

## Error Handling Examples

### Network Error Handling
```typescript
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  // Process response
} catch (error) {
  if (error.name === 'TimeoutError') {
    // Handle timeout
  } else if (error instanceof TypeError) {
    // Handle network error
  } else {
    // Handle other errors
  }
}
```

### API Error Handling
```typescript
if (!response.ok) {
  switch (response.status) {
    case 401:
      throw new Error('Unauthorized - check API credentials')
    case 429:
      const retryAfter = response.headers.get('Retry-After')
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`)
    case 500:
      throw new Error('Server error - try again later')
    default:
      throw new Error(`API error: ${response.status}`)
  }
}
```

## Testing API Integrations
- Mock HTTP responses in tests
- Test error scenarios
- Validate request/response schemas
- Use test API keys/sandboxes
