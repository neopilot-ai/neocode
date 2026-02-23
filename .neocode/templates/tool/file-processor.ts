export default {
  name: 'file-processor',
  description: 'Process files with various operations and transformations',
  version: '1.0.0',
  
  execute: async (context: ToolContext) => {
    const { operation, input, output, options } = context
    
    try {
      switch (operation) {
        case 'read':
          return await readFile(input, options)
        case 'write':
          return await writeFile(output, input, options)
        case 'transform':
          return await transformFile(input, output, options)
        case 'batch':
          return await batchProcess(options)
        default:
          throw new Error(`Unknown operation: ${operation}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `File processing failed: ${error.message}`
      }
    }
  },
  
  schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'transform', 'batch'],
        description: 'The operation to perform'
      },
      input: {
        type: 'string',
        description: 'Input file path or content'
      },
      output: {
        type: 'string',
        description: 'Output file path (for write/transform operations)'
      },
      options: {
        type: 'object',
        properties: {
          encoding: { type: 'string', default: 'utf-8' },
          format: { type: 'string', enum: ['json', 'text', 'binary'] },
          transform: { type: 'string', description: 'Transformation function name' },
          pattern: { type: 'string', description: 'File pattern for batch operations' }
        }
      }
    },
    required: ['operation']
  }
}

interface ToolContext {
  operation: string
  input?: string
  output?: string
  options: Record<string, any>
  workspace: string
  cwd: string
}

async function readFile(filePath: string, options: Record<string, any>) {
  const file = Bun.file(filePath)
  
  if (!await file.exists()) {
    throw new Error(`File not found: ${filePath}`)
  }
  
  const content = options.format === 'binary' 
    ? await file.arrayBuffer()
    : await file.text()
  
  return {
    success: true,
    data: {
      content,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }
  }
}

async function writeFile(filePath: string, content: string, options: Record<string, any>) {
  const encoder = new TextEncoder()
  const data = typeof content === 'string' 
    ? encoder.encode(content)
    : content
  
  await Bun.write(filePath, data)
  
  return {
    success: true,
    data: {
      filePath,
      size: data.byteLength,
      written: new Date().toISOString()
    }
  }
}

async function transformFile(inputPath: string, outputPath: string, options: Record<string, any>) {
  // Read input file
  const readResult = await readFile(inputPath, options)
  if (!readResult.success) {
    return readResult
  }
  
  let transformedContent = readResult.data.content
  
  // Apply transformations
  switch (options.transform) {
    case 'uppercase':
      transformedContent = transformedContent.toUpperCase()
      break
    case 'lowercase':
      transformedContent = transformedContent.toLowerCase()
      break
    case 'json-format':
      if (options.format === 'json') {
        const parsed = JSON.parse(transformedContent)
        transformedContent = JSON.stringify(parsed, null, 2)
      }
      break
    case 'remove-comments':
      transformedContent = transformedContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      break
    default:
      throw new Error(`Unknown transform: ${options.transform}`)
  }
  
  // Write transformed content
  return await writeFile(outputPath, transformedContent, options)
}

async function batchProcess(options: Record<string, any>) {
  const { pattern, operation, output } = options
  const glob = new Bun.Glob(pattern)
  const files = await Array.fromAsync(glob.scan({ cwd: options.cwd || '.' }))
  
  const results = []
  
  for (const file of files) {
    try {
      const result = await transformFile(file, `${output}/${file}`, options)
      results.push({ file, ...result })
    } catch (error) {
      results.push({ 
        file, 
        success: false, 
        error: error.message 
      })
    }
  }
  
  return {
    success: true,
    data: {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }
}
