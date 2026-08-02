# Neo Code CLI

The AI coding agent built for the terminal. Generate code from natural language, automate tasks, and run terminal commands -- powered by 500+ AI models.

![Neo CLI showing code edits in a terminal](https://raw.githubusercontent.com/Neopilot-Ai/neocode/main/packages/neo-docs/public/img/npm-package-readme/neo-cli.png)

Neo is the all-in-one agentic engineering platform. Build, ship, and iterate faster with the most popular open source coding agent.

[Website](https://neo.khulnasoft.com) · [Install](https://neo.khulnasoft.com/install) · [IDE](https://neo.khulnasoft.com/landing/vs-code) · [CLI](https://neo.khulnasoft.com/cli) · [Docs](https://neo.khulnasoft.com/docs) · [Models](https://neo.khulnasoft.com/leaderboard) · [Gateway](https://neo.khulnasoft.com/gateway) · [Pricing](https://neo.khulnasoft.com/pricing) · [Neo Pass](https://neo.khulnasoft.com/pricing/neo-pass)

[500+ models](https://neo.khulnasoft.com/leaderboard). One open source agent in [VS Code](https://neo.khulnasoft.com/vscode-marketplace), [JetBrains](https://plugins.jetbrains.com/plugin/27133-neo-code), [CLI](https://www.npmjs.com/package/@neocode/cli), [Slack](https://neo.khulnasoft.com/slack), and [Cloud](https://neo.khulnasoft.com/cloud).

## Install

```bash
npm install -g @neocode/cli
```

Or run directly with npx:

```bash
npx --package @neocode/cli neo
```

## Getting Started

Run `neo` in any project directory to launch the interactive TUI:

```bash
neo
```

Run a one-off task:

```bash
neo run "add input validation to the signup form"
```

## Features

- **Code generation** -- describe what you want in natural language
- **Terminal commands** -- the agent can run shell commands on your behalf
- **500+ AI models** -- use models from OpenAI, Anthropic, Google, and more
- **MCP servers** -- extend agent capabilities with the Model Context Protocol
- **Multiple modes** -- Plan with Architect, code with Coder, debug with Debugger, or create your own
- **Sessions** -- resume previous conversations and export transcripts
- **API keys optional** -- bring your own keys or use Neo credits

## Commands

| Command               | Description                |
| --------------------- | -------------------------- |
| `neo`                | Launch interactive TUI     |
| `neo run "<task>"`   | Run a one-off task         |
| `neo auth`           | Manage authentication      |
| `neo models`         | List available models      |
| `neo mcp`            | Manage MCP servers         |
| `neo session list`   | List sessions              |
| `neo session delete` | Delete a session           |
| `neo export`         | Export session transcripts |

Run `neo --help` for the full list.

## Alternative Installation

### Homebrew (macOS/Linux)

```bash
brew install Neopilot-Ai/tap/neo
```

### GitHub Releases

Download pre-built binaries from the [Releases page](https://github.com/Neopilot-Ai/neocode/releases).

## Documentation

- [Docs](https://neo.khulnasoft.com/docs)
- [Getting Started](https://neo.khulnasoft.com/docs/getting-started)

## Links

- [GitHub](https://github.com/Neopilot-Ai/neocode)
- [Discord](https://neo.khulnasoft.com/discord)
- [VS Code Extension](https://neo.khulnasoft.com/vscode-marketplace)
- [Website](https://neo.khulnasoft.com)

## License

MIT
