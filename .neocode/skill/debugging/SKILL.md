---
name: debugging
description: Systematic debugging and troubleshooting techniques
---

## Use this when
- Investigating bugs and unexpected behavior
- Analyzing error messages and stack traces
- Performance troubleshooting
- Memory leak detection
- Logic error resolution

## Implementation

### Step 1: Problem Identification
- Reproduce the issue consistently
- Gather error messages and logs
- Identify when the issue started
- Determine the scope of the problem

### Step 2: Information Gathering
- Collect relevant logs and metrics
- Check recent changes
- Review error messages carefully
- Document the expected vs actual behavior

### Step 3: Hypothesis Formation
- Formulate possible causes
- Prioritize likely scenarios
- Consider environmental factors
- Account for edge cases

### Step 4: Systematic Testing
- Test hypotheses one at a time
- Use controlled experiments
- Isolate variables
- Document results

### Step 5: Root Cause Analysis
- Identify the underlying cause
- Understand why the issue occurred
- Look for related problems
- Consider long-term implications

## Debugging Techniques

### Logging Strategy
```typescript
// Structured logging
const logger = {
  debug: (message: string, data?: any) => {
    console.log(`[DEBUG] ${message}`, data || '')
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data || '')
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error?.stack || '')
  }
}

// Usage in code
function processData(data: any) {
  logger.debug('Processing data', { input: data })
  
  try {
    const result = transform(data)
    logger.info('Processing completed', { output: result })
    return result
  } catch (error) {
    logger.error('Processing failed', error)
    throw error
  }
}
```

### Error Handling Patterns
```typescript
// Comprehensive error handling
async function apiCall(url: string, options?: RequestOptions) {
  try {
    logger.debug('Making API call', { url, options })
    
    const response = await fetch(url, {
      timeout: 5000,
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    logger.debug('API call successful', { status: response.status })
    
    return data
  } catch (error) {
    if (error instanceof Error) {
      logger.error('API call failed', error)
      
      // Categorize errors for better handling
      if (error.message.includes('timeout')) {
        throw new TimeoutError('Request timed out')
      } else if (error.message.includes('network')) {
        throw new NetworkError('Network connection failed')
      } else {
        throw error
      }
    }
    throw new Error('Unknown error occurred')
  }
}
```

### Performance Debugging
```typescript
// Performance monitoring
class PerformanceMonitor {
  private timers: Map<string, number> = new Map()
  
  startTimer(name: string) {
    this.timers.set(name, performance.now())
  }
  
  endTimer(name: string) {
    const start = this.timers.get(name)
    if (start) {
      const duration = performance.now() - start
      logger.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` })
      this.timers.delete(name)
      return duration
    }
  }
  
  // Measure function execution time
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name)
    try {
      const result = await fn()
      return result
    } finally {
      this.endTimer(name)
    }
  }
}

// Usage
const monitor = new PerformanceMonitor()

async function expensiveOperation() {
  return await monitor.measure('expensive-operation', async () => {
    // Complex operation here
    await new Promise(resolve => setTimeout(resolve, 1000))
    return 'result'
  })
}
```

### Memory Debugging
```typescript
// Memory usage tracking
class MemoryMonitor {
  private baseline: number = 0
  
  captureBaseline() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.baseline = process.memoryUsage().heapUsed
      logger.debug('Memory baseline captured', { 
        memory: `${(this.baseline / 1024 / 1024).toFixed(2)}MB` 
      })
    }
  }
  
  checkMemory(label: string) {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const current = process.memoryUsage().heapUsed
      const diff = current - this.baseline
      logger.debug(`Memory check: ${label}`, { 
        current: `${(current / 1024 / 1024).toFixed(2)}MB`,
        diff: `${(diff / 1024 / 1024).toFixed(2)}MB`
      })
    }
  }
}

// Usage
const memoryMonitor = new MemoryMonitor()
memoryMonitor.captureBaseline()

// ... code that might leak memory ...

memoryMonitor.checkMemory('after operation')
```

## Common Debugging Scenarios

### Null/Undefined Errors
```typescript
// Defensive programming
function safeAccess(obj: any, path: string) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

// Usage
const value = safeAccess(data, 'user.profile.name')
if (value) {
  // Safe to use value
}
```

### Async/Await Debugging
```typescript
// Debug async operations
async function debugAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  logger.debug(`Starting async operation: ${name}`)
  
  try {
    const result = await fn()
    logger.debug(`Completed async operation: ${name}`, { result })
    return result
  } catch (error) {
    logger.error(`Failed async operation: ${name}`, error)
    throw error
  }
}

// Usage
const result = await debugAsync('fetch-data', () => 
  fetch('/api/data').then(res => res.json())
)
```

### Race Condition Detection
```typescript
// Detect and handle race conditions
class RaceConditionDetector {
  private operations: Set<string> = new Set()
  
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.operations.has(key)) {
      logger.warn(`Potential race condition detected for key: ${key}`)
    }
    
    this.operations.add(key)
    
    try {
      const result = await fn()
      return result
    } finally {
      this.operations.delete(key)
    }
  }
}
```

## Debugging Tools and Techniques

### Browser DevTools
- **Console**: Log messages and errors
- **Network**: Monitor HTTP requests
- **Performance**: Analyze runtime performance
- **Memory**: Detect memory leaks
- **Debugger**: Set breakpoints and step through code

### Node.js Debugging
```bash
# Start Node.js with debugging
node --inspect index.js

# Use Chrome DevTools for debugging
chrome://inspect

# Debug with VSCode
# Add launch configuration in .vscode/launch.json
```

### Logging Best Practices
- Use structured logging with consistent format
- Include relevant context (timestamps, request IDs, user info)
- Log at appropriate levels (debug, info, warn, error)
- Avoid logging sensitive information
- Use correlation IDs for tracking requests across services

## Troubleshooting Checklist

### Before Debugging
- [ ] Can I reproduce the issue consistently?
- [ ] Do I have the latest version of the code?
- [ ] Are all dependencies properly installed?
- [ ] Is the environment configured correctly?

### During Debugging
- [ ] Am I testing one hypothesis at a time?
- [ ] Am I documenting my findings?
- [ ] Am I considering all possible causes?
- [ ] Am I using appropriate debugging tools?

### After Debugging
- [ ] Have I identified the root cause?
- [ ] Have I implemented a proper fix?
- [ ] Have I added tests to prevent regression?
- [ ] Have I documented the solution?

## Prevention Strategies

### Code Reviews
- Look for potential error scenarios
- Check for proper error handling
- Verify logging is adequate
- Ensure defensive programming practices

### Monitoring
- Set up alerts for error rates
- Monitor performance metrics
- Track resource usage
- Implement health checks

### Testing
- Write comprehensive unit tests
- Include integration tests
- Test error scenarios
- Use property-based testing for edge cases
