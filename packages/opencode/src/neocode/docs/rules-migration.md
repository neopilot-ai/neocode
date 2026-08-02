# Neocode Rules Migration

This document explains how Neocode rules are automatically migrated to Opencode's `instructions` config array.

## Overview

Neocode stores rules in various file locations. When Opencode starts, it reads these files and injects their paths into the `instructions` config array, which Opencode then loads as part of the system prompt.

## Key Guarantees

### 1. Read-Only Migration

The migration **never modifies project files**. We only:

- Read existing rule files from disk
- Inject file paths into the config's `instructions` array
- Never write to the project or modify any files

### 2. Combines with Existing Config (Never Overwrites)

If you have existing opencode config with `instructions`, the Neocode rules are **combined**, not replaced:

```typescript
// Example: User has opencode.json with:
{ "instructions": ["AGENTS.md", "custom-rules.md"] }

// Neocode rules add:
{ "instructions": [".neocoderules", ".neocode/rules/coding.md"] }

// Result (combined, deduplicated):
{ "instructions": ["AGENTS.md", "custom-rules.md", ".neocoderules", ".neocode/rules/coding.md"] }
```

### 3. Restart to Pick Up Changes

If you change your Neocode configuration (e.g., edit `.neocoderules`), simply restart neo-cli to pick up the new config. No manual migration or conversion needed.

## Source Locations

The migrator reads rules from these locations:

### Project Rules

| Location | Description |
|---|---|
| `.neocoderules` | Legacy single-file rules in project root |
| `.neocode/rules/*.md` | Directory-based rules (multiple markdown files) |
| `.neocoderules-{mode}` | Mode-specific legacy rules (e.g., `.neocoderules-code`) |
| `.neocode/rules-{mode}/*.md` | Mode-specific rule directories |

### Global Rules

| Location | Description |
|---|---|
| `~/.neocode/rules/*.md` | Global rules directory |

## File Mapping

| Neocode Location | Opencode Equivalent |
|---|---|
| `.neocoderules` | `instructions: [".neocoderules"]` |
| `.neocoderules-{mode}` | `instructions: [".neocoderules-{mode}"]` |
| `.neocode/rules/*.md` | `instructions: [".neocode/rules/file.md", ...]` |
| `.neocode/rules-{mode}/*.md` | `instructions: [".neocode/rules-{mode}/file.md", ...]` |
| `~/.neocode/rules/*.md` | `instructions: ["~/.neocode/rules/file.md", ...]` |

## AGENTS.md Compatibility

`AGENTS.md` is loaded **natively** by Opencode - no migration needed. Opencode automatically loads:

- `AGENTS.md` in project root
- `CLAUDE.md` in project root
- `~/.config/neo/AGENTS.md` (global)

## Not Migrated

The following are **not** migrated:

- `.roorules` - Roo-specific rules
- `.clinerules` - Cline-specific rules

Only Neocode-specific files (`.neocoderules`, `.neocode/rules/`) are migrated.

## Mode-Specific Rules

Mode-specific rules (e.g., `.neocoderules-code`, `.neocode/rules-architect/`) are included by default. All mode-specific rules are loaded regardless of the current mode.

## Warnings

The migrator generates warnings for:

- **Legacy files**: When `.neocoderules` is found, a warning suggests migrating to `.neocode/rules/` directory structure

## Example

### Before (Neocode)

```
project/
├── .neocoderules           # Legacy rules
├── .neocoderules-code      # Code-mode specific
└── .neocode/
    └── rules/
        ├── coding.md        # Coding standards
        └── testing.md       # Testing guidelines
```

### After (Opencode Config)

```json
{
  "instructions": [
    "/path/to/project/.neocode/rules/coding.md",
    "/path/to/project/.neocode/rules/testing.md",
    "/path/to/project/.neocoderules",
    "/path/to/project/.neocoderules-code"
  ]
}
```

## Troubleshooting

### Rules not appearing

1. Check the file exists at the expected location
2. Ensure markdown files have `.md` extension
3. Restart neo-cli to pick up changes

### Duplicate rules

The `mergeConfigConcatArrays` function automatically deduplicates the `instructions` array using `Array.from(new Set([...]))`.

## Related Files

- [`rules-migrator.ts`](../rules-migrator.ts) - Core migration logic
- [`config-injector.ts`](../config-injector.ts) - Config building and injection
- [`modes-migration.md`](./modes-migration.md) - Modes migration documentation
