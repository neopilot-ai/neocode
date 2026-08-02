# Dedicated Output Channel

**Priority:** P2

Agent Manager has its own output channel. No general "Neo Code" output channel exists.

## Remaining Work

- Create `vscode.window.createOutputChannel("Neo Code")` during activation
- Centralized logging utility with log levels (debug, info, warn, error)
- Route all `[Neo New]` log messages to this channel
- Dispose on deactivation
- Migrate existing `console.log("[Neo New] ...")` calls to the logger
