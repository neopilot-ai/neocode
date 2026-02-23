# NeoCode Configuration

This directory contains NeoCode's configuration, extensions, and customizations.

## 📁 Structure

```
.neocode/
├── config.json          # JSON schema for configuration validation
├── neocode.jsonc        # Main configuration file
├── package.json         # Plugin dependencies
├── agent/               # AI agent configurations
├── command/             # Custom command definitions
├── skill/               # Skills and capabilities
├── tool/                # Tool implementations
└── themes/              # UI themes
```

## ⚙️ Configuration

### Main Config (`neocode.jsonc`)

```jsonc
{
  "$schema": "./config.json",
  "provider": {
    "neocode": {
      "options": {}
    }
  },
  "mcp": {},
  "tools": {
    "github-triage": true,
    "github-pr-search": true
  }
}
```

### Key Settings

- **provider**: AI model providers and options
- **mcp**: Model Context Protocol configurations
- **tools**: Enable/disable built-in tools
- **theme**: UI theme selection
- **keybinds**: Custom keyboard shortcuts

## 🚀 Extensions

### Agents (`agent/`)
AI agent configurations for specialized tasks.

**Example agent:**
```markdown
---
description: Specialized agent for documentation
color: "#38A3EE"
---

You are an expert technical documentation writer...
```

### Commands (`command/`)
Custom command definitions.

**Example command:**
```markdown
---
description: Commit current changes with AI assistance
---

Generate meaningful commit messages...
```

### Skills (`skill/`)
Reusable skills and capabilities.

**Example skill structure:**
```
skill/
├── my-skill/
│   ├── SKILL.md       # Skill description and usage
│   ├── implementation.ts # Optional implementation
│   └── examples/      # Usage examples
```

### Tools (`tool/`)
Tool implementations.

**Example tool:**
```typescript
// github-triage.ts
export default {
  name: 'github-triage',
  description: 'Triage GitHub issues',
  execute: async (context) => {
    // Tool implementation
  }
}
```

### Themes (`themes/`)
Custom UI themes.

**Example theme:**
```json
{
  "name": "mytheme",
  "colors": {
    "primary": "#007acc",
    "background": "#1e1e1e"
  }
}
```

## 🛠️ Adding Extensions

### 1. Create a New Skill

```bash
mkdir skill/my-new-skill
cd skill/my-new-skill
```

Create `SKILL.md`:
```markdown
---
name: my-new-skill
description: Brief description of what this skill does
---

## Use this when
- Specific condition 1
- Specific condition 2

## Implementation
[Implementation details]
```

### 2. Create a New Tool

Create `tool/my-tool.ts`:
```typescript
export default {
  name: 'my-tool',
  description: 'Tool description',
  execute: async (context: any) => {
    // Your tool logic here
    return result
  }
}
```

### 3. Create a New Agent

Create `agent/my-agent.md`:
```markdown
---
description: Agent specialization
color: "#FF5722"
---

You are a specialized agent for...
```

### 4. Create a New Theme

Create `themes/my-theme.json`:
```json
{
  "name": "my-theme",
  "displayName": "My Theme",
  "colors": {
    "primary": "#2196F3",
    "secondary": "#FFC107",
    "background": "#121212",
    "surface": "#1E1E1E",
    "text": "#FFFFFF"
  }
}
```

## 🔧 Common Configurations

### Development Setup
```jsonc
{
  "tools": {
    "github-triage": true,
    "github-pr-search": true
  },
  "provider": {
    "neocode": {
      "options": {
        "model": "neocode/gpt-5-nano"
      }
    }
  }
}
```

### Enterprise Setup
```jsonc
{
  "enterprise": {
    "url": "https://enterprise.example.com"
  },
  "provider": {
    "neocode": {
      "options": {
        "api_key": "your-enterprise-key"
      }
    }
  }
}
```

## 📝 Tips

1. **Use descriptive names** for extensions
2. **Follow the existing patterns** for file structure
3. **Add frontmatter** to markdown files for metadata
4. **Test configurations** before committing
5. **Use comments** in JSONC files for clarity

## 🤝 Contributing

When adding new extensions:

1. Follow the existing directory structure
2. Use appropriate file naming conventions
3. Include documentation and examples
4. Test your changes thoroughly

## 📚 Additional Resources

- [NeoCode Documentation](../../docs/)
- [Configuration Schema](./config.json)
- [Extension Examples](./skill/bun-file-io/)
