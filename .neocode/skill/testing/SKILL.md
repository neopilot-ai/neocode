---
name: testing
description: Comprehensive testing strategies and implementation
---

## Use this when
- Writing unit tests for new functionality
- Creating integration tests
- Setting up test infrastructure
- Debugging test failures
- Improving test coverage

## Implementation

### Step 1: Test Planning
- Identify test scenarios and edge cases
- Choose appropriate testing framework
- Plan test structure and organization
- Define test data and fixtures

### Step 2: Unit Testing
- Test individual functions and components
- Mock external dependencies
- Test both happy path and error cases
- Ensure tests are fast and isolated

### Step 3: Integration Testing
- Test component interactions
- Test database operations
- Test API integrations
- Use test databases/services

### Step 4: End-to-End Testing
- Test complete user workflows
- Test UI interactions
- Test real user scenarios
- Use browser automation when needed

## Testing Patterns

### Unit Test Structure
```typescript
// Using Bun test framework
import { describe, it, expect, beforeEach } from 'bun:test'

describe('Component/Function Name', () => {
  let subject: any
  
  beforeEach(() => {
    // Setup test subject
    subject = new Component()
  })
  
  describe('Core functionality', () => {
    it('should handle basic case', () => {
      const result = subject.method(input)
      expect(result).toBe(expected)
    })
    
    it('should handle edge case', () => {
      const result = subject.method(edgeInput)
      expect(result).toBe(expected)
    })
  })
  
  describe('Error handling', () => {
    it('should throw appropriate error', () => {
      expect(() => subject.method(invalidInput)).toThrow()
    })
  })
})
```

### Mock Strategy
```typescript
// Mock external dependencies
const mockApi = {
  fetch: jest.fn().mockResolvedValue({ data: 'test' })
}

// Mock file system
const mockFs = {
  readFile: jest.fn().mockResolvedValue('file content')
}

// Use mocks in tests
it('should use external API correctly', async () => {
  const result = await subject.processData()
  expect(mockApi.fetch).toHaveBeenCalledWith(expectedUrl)
  expect(result).toBe(expectedResult)
})
```

### Test Data Management
```typescript
// Test fixtures
const testFixtures = {
  validUser: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com'
  },
  invalidUser: {
    id: null,
    name: '',
    email: 'invalid'
  }
}

// Use fixtures in tests
it('should validate user data', () => {
  expect(validateUser(testFixtures.validUser)).toBe(true)
  expect(validateUser(testFixtures.invalidUser)).toBe(false)
})
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests focused and small
- Follow arrange-act-assert pattern

### Test Data
- Use consistent test data
- Avoid hardcoded values in tests
- Use factories for complex objects
- Clean up test data after tests

### Mocking
- Mock only external dependencies
- Keep mocks simple and focused
- Verify mock interactions
- Reset mocks between tests

### Coverage
- Aim for high coverage of critical paths
- Focus on business logic over trivial code
- Use coverage reports to identify gaps
- Don't sacrifice test quality for coverage percentage

## Common Testing Scenarios

### API Testing
```typescript
describe('API Integration', () => {
  it('should handle successful response', async () => {
    const mockResponse = { data: 'success' }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    
    const result = await apiCall('/endpoint')
    expect(result).toEqual(mockResponse)
  })
  
  it('should handle API errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })
    
    await expect(apiCall('/endpoint')).rejects.toThrow()
  })
})
```

### Database Testing
```typescript
describe('Database Operations', () => {
  let db: any
  
  beforeEach(async () => {
    db = await createTestDatabase()
    await db.migrate()
  })
  
  afterEach(async () => {
    await db.close()
  })
  
  it('should create and retrieve records', async () => {
    const created = await db.users.create(testUser)
    const retrieved = await db.users.findById(created.id)
    
    expect(retrieved).toEqual(created)
  })
})
```

### Component Testing
```typescript
describe('UI Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Component prop="value" />)
    expect(getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('should handle user interactions', async () => {
    const handleClick = jest.fn()
    const { getByRole } = render(<Button onClick={handleClick} />)
    
    await userEvent.click(getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

## Performance Testing

### Load Testing
```typescript
describe('Performance', () => {
  it('should handle concurrent requests', async () => {
    const promises = Array.from({ length: 100 }, () => 
      apiCall('/endpoint')
    )
    
    const results = await Promise.all(promises)
    expect(results).toHaveLength(100)
  })
  
  it('should complete within time limit', async () => {
    const start = Date.now()
    await expensiveOperation()
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(1000) // 1 second
  })
})
```

## Debugging Tests

### Common Issues
- **Async test timeouts**: Use proper async/await or return promises
- **Mock not working**: Check mock setup and reset
- **Test isolation**: Ensure tests don't share state
- **Flaky tests**: Identify and fix race conditions

### Debugging Techniques
```typescript
// Add debug output
it('should work correctly', () => {
  console.log('Input:', input)
  const result = subject.method(input)
  console.log('Result:', result)
  expect(result).toBe(expected)
})

// Use test spies
const spy = jest.spyOn(subject, 'method')
subject.method(input)
expect(spy).toHaveBeenCalledWith(input)
```

## Continuous Integration

### CI Test Configuration
```yaml
# Example CI configuration
test:
  script:
    - bun install
    - bun test --coverage
    - bun run lint
    - bun run typecheck
  coverage: '/Coverage: \d+\.\d+%/'
```

### Test Reports
- Generate coverage reports
- Upload test results to CI system
- Set up test result notifications
- Track test performance over time
