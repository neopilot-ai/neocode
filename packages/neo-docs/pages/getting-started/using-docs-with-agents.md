---
title: "Using Neo Docs with Agents"
description: "Access the full Neo Code documentation in machine-readable formats for LLMs and AI agents"
---

# Using Neo Docs with Agents

You can access the full text of the Neo Code documentation in machine-readable formats suitable for LLMs and AI agents. This is useful when you want an AI assistant to reference Neo Code's documentation while helping you with a task.

## Full documentation

The complete documentation is available as a single text file at:

```
https://neo.khulnasoft.com/docs/llms.txt
```

This file contains the full content of every page in the Neo Code docs, formatted for easy consumption by language models.

## Individual pages

You can also fetch any individual documentation page as raw Markdown via the API:

```
https://neo.khulnasoft.com/docs/api/raw-markdown?path=<url-encoded-path>
```

For example, to fetch the "Code with AI" overview page:

```
https://neo.khulnasoft.com/docs/api/raw-markdown?path=%2Fcode-with-ai
```

The `path` parameter should be the URL-encoded path of the documentation page, without the `/docs` prefix.
