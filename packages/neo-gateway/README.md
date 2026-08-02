# @neocode/neo-gateway

Unified Neo Gateway package for OpenCode providing authentication, AI provider integration, and API access.

## Features

- **Authentication**: Device authorization flow for Neo Gateway
- **AI Provider**: OpenRouter-based provider with Neo Gateway integration
- **API Integration**: Profile, balance, and model management
- **TUI Helpers**: Utilities for terminal UI components

## Installation

```bash
bun add @neocode/neo-gateway
```

## Usage

### Plugin Registration

```typescript
import { NeoAuthPlugin } from "@neocode/neo-gateway"

// Register with OpenCode
const plugins = [NeoAuthPlugin]
```

### Provider Usage

```typescript
import { createNeo } from "@neocode/neo-gateway"

const provider = createNeo({
  neocodeToken: process.env.NEOCODE_API_KEY,
  neocodeOrganizationId: "org-123",
})

const model = provider.languageModel("anthropic/claude-sonnet-4")
```

### API Access

```typescript
import { fetchProfile, fetchBalance } from "@neocode/neo-gateway"

const profile = await fetchProfile(token)
const balance = await fetchBalance(token)
```

## License

MIT
