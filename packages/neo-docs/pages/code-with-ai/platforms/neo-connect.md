---
title: "Neo Connect"
description: "Use Neo Code from Slack, GitHub, and Linear, and connect DoltHub data"
---

# Neo Connect

**Neo Connect** brings Neo Code into the tools your team already uses. Instead of switching to a separate interface, you can trigger implementations, ask questions, and get pull requests opened from your chat, issue tracker, or code review workflow. You can also connect DoltHub as a data source for Dolt-versioned data.

---

## Supported Integrations

| Integration | Entry Point | What It Can Do |
|---|---|---|
| [Slack](/docs/code-with-ai/platforms/slack) | `@Neo` in any channel or DM | Ask questions, implement fixes, debug issues |
| [GitHub](/docs/code-with-ai/platforms/github) | `@neocode-bot` on issues and PRs | Fix issues, review code, cross-repo changes |
| [Linear](/docs/code-with-ai/platforms/linear) | `@neo` on any issue | Implement fixes, investigate bugs, cross-repo changes |
| DoltHub | [Connect DoltHub](https://app.neo.khulnasoft.com/integrations/dolthub) from Integrations | Query Dolt-versioned data and authorize DoltHub access for Gas Town Wasteland |

---

## How to Set Up

All integrations are configured from the **Integrations** tab at [app.neo.khulnasoft.com](https://app.neo.khulnasoft.com). Each integration requires:

- A Neo Code account with available credits
- The specific integration installed and authorized for your workspace
- A connected Git provider (GitHub or GitLab) for repository workflows such as Cloud Agents, Code Reviews, and Neo Deploy
