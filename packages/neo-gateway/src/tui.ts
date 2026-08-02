/**
 * Neo Gateway TUI Integration
 *
 * This module provides TUI-specific functionality for neo-gateway.
 * It requires OpenCode TUI dependencies to be injected at runtime.
 *
 * Import from "@neocode/neo-gateway/tui" for TUI features.
 */

// ============================================================================
// TUI Dependency Injection
// ============================================================================
export { initializeTUIDependencies, getTUIDependencies, areTUIDependenciesInitialized } from "./tui/context.js"
export type { TUIDependencies } from "./tui/types.js"

// ============================================================================
// TUI Helpers
// ============================================================================
export { formatProfileInfo, getOrganizationOptions, getDefaultOrganizationSelection } from "./tui/helpers.js"

// ============================================================================
// NOTE: TUI Components Moved to OpenCode
// ============================================================================
// All TUI components with JSX have been moved to packages/opencode/src/neocode/
// to ensure correct JSX transpilation with @opentui/solid.
//
// Components moved:
// - registerNeoCommands -> @/neocode/neo-commands
// - DialogNeoTeamSelect -> @/neocode/components/dialog-neo-team-select
// - DialogNeoOrganization -> @/neocode/components/dialog-neopilot-aianization
// - DialogNeoProfile -> @/neocode/components/dialog-neo-profile
// - NeoAutoMethod -> @/neocode/components/dialog-neo-auto-method
// - NeoNews -> @/neocode/components/neo-news
// - NotificationBanner -> @/neocode/components/notification-banner
// - DialogNeoNotifications -> @/neocode/components/dialog-neo-notifications
