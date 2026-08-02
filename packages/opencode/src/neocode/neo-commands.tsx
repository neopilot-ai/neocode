/**
 * Neo Gateway Commands for TUI
 *
 * Provides /profile and /teams commands that are only visible when connected to Neo Gateway.
 */

import { createMemo } from "solid-js"
import { useBindings } from "@tui/keymap"
import { useSync } from "@tui/context/sync"
import { useRoute } from "@tui/context/route"
import { useDialog } from "@tui/ui/dialog"
import { useToast } from "@tui/ui/toast"
import { DialogAlert } from "@tui/ui/dialog-alert"
import type { Organization } from "@neocode/neo-gateway"
import type { ClawStatus } from "./claw/types.js"
import { DialogNeoTeamSelect } from "./components/dialog-neo-team-select.js"
import { DialogNeoProfile } from "./components/dialog-neo-profile.js"
import { DialogClawSetup } from "./components/dialog-claw-setup.js"
import { DialogClawUpgrade } from "./components/dialog-claw-upgrade.js"
import { DialogIndexing } from "./components/dialog-indexing.js"
import { indexingEnabled } from "./indexing-feature"
import { refreshBalance } from "./balance-refresh"

// These types are OpenCode-internal and imported at runtime
type UseSDK = any
type SDK = any

/**
 * Register all Neo Gateway commands
 * Call this from a component inside the TUI app
 *
 * @param useSDK - OpenCode's useSDK hook (passed from TUI context)
 */
export function registerNeoCommands(useSDK: () => UseSDK) {
  const sync = useSync()
  const route = useRoute()
  const dialog = useDialog()
  const sdk = useSDK()
  const toast = useToast()

  // Only show Neo commands when connected to Neo Gateway
  const isNeoConnected = createMemo(() => {
    return sync.data.provider_next.connected.includes("neo")
  })
  const indexing = createMemo(() => indexingEnabled(sync.data.config))

  useBindings(() => ({
    commands: [
      // /neoclaw command
      {
        name: "neo.claw",
        title: "NeoClaw",
        desc: "Open NeoClaw chat & dashboard",
        category: "Neo",
        slashName: "neoclaw",
        slashAliases: ["claw"],
        enabled: isNeoConnected(),
        hidden: !isNeoConnected(),
        run: async () => {
          // Fetch profile (for org context) and instance status in parallel
          const [profileRes, res] = await Promise.all([
            sdk.client.neo.profile().catch(() => null),
            sdk.client.neo.claw.status().catch(() => null),
          ])
          const orgId = profileRes?.data?.currentOrgId ?? null
          const status = res?.data as ClawStatus | undefined

          // No instance provisioned
          if (!status || !status.userId || res.error) {
            dialog.replace(() => <DialogClawSetup orgId={orgId} />)
            return
          }

          // Instance exists — check for chat credentials
          const creds = await sdk.client.neo.claw.chatCredentials().catch(() => null)

          if (!creds?.data || creds.error) {
            // Instance exists but no chat credentials — needs upgrade
            dialog.replace(() => <DialogClawUpgrade orgId={orgId} />)
            return
          }

          // Everything ready — navigate to full-screen chat view
          route.navigate({ type: "neoclaw" })
          dialog.clear()
        },
      },

      // /remote command
      {
        name: "remote.toggle",
        title: "Toggle remote",
        desc: "Enable or disable remote session relay",
        category: "Neo",
        slashName: "remote",
        enabled: isNeoConnected(),
        hidden: !isNeoConnected(),
        run: async () => {
          try {
            const current = await sdk.client.remote.status()

            if (current.error || !current.data) {
              dialog.replace(() => <DialogAlert title="Error" message="Failed to fetch remote status." />)
              return
            }

            if (current.data.enabled) {
              await sdk.client.remote.disable()
              toast.show({ message: "Remote disabled", variant: "success" })
            } else {
              const result = await sdk.client.remote.enable()
              if (result.error) {
                const err = result.error as { error?: string }
                const msg = err?.error ?? "Failed to enable remote."
                dialog.replace(() => <DialogAlert title="Error" message={msg} />)
                return
              }
              toast.show({ message: "Remote enabled", variant: "success" })
            }

            dialog.clear()
          } catch (error) {
            dialog.replace(() => <DialogAlert title="Error" message={`Failed to toggle remote: ${error}`} />)
          }
        },
      },

      // /profile command
      {
        name: "neo.profile",
        title: "Profile",
        desc: "View your Neo Gateway profile",
        category: "Neo",
        slashName: "profile",
        slashAliases: ["me", "whoami"],
        enabled: isNeoConnected(),
        hidden: !isNeoConnected(),
        run: async () => {
          try {
            // Fetch profile and balance using server endpoint
            const response = await sdk.client.neo.profile()

            if (response.error || !response.data) {
              dialog.replace(() => (
                <DialogAlert
                  title="Error"
                  message="Failed to fetch profile. Please ensure you're authenticated with Neo Gateway."
                />
              ))
              return
            }

            const { profile, balance, currentOrgId } = response.data

            // Show profile dialog with clickable usage link
            dialog.replace(() => <DialogNeoProfile profile={profile} balance={balance} currentOrgId={currentOrgId} />)
          } catch (error) {
            dialog.replace(() => <DialogAlert title="Error" message={`Failed to fetch profile: ${error}`} />)
          }
        },
      },

      ...(indexing()
        ? [
            {
              name: "neo.indexing",
              title: "Indexing",
              desc: "Configure codebase indexing",
              category: "Neo",
              slashName: "indexing",
              slashAliases: ["index", "embedding"],
              run: () => {
                dialog.replace(() => <DialogIndexing useSDK={useSDK} />)
              },
            },
          ]
        : []),

      // /teams command
      {
        name: "neo.teams",
        title: "Teams",
        desc: "Switch between Neo Gateway teams",
        category: "Neo",
        slashName: "teams",
        slashAliases: ["team", "org", "orgs"],
        enabled: isNeoConnected(),
        hidden: !isNeoConnected(),
        run: async () => {
          try {
            // Fetch profile to get organizations
            const response = await sdk.client.neo.profile()

            if (response.error || !response.data) {
              dialog.replace(() => (
                <DialogAlert
                  title="Error"
                  message="Failed to fetch teams. Please ensure you're authenticated with Neo Gateway."
                />
              ))
              return
            }

            const { profile, currentOrgId } = response.data

            if (!profile.organizations || profile.organizations.length === 0) {
              dialog.replace(() => (
                <DialogAlert
                  title="No Teams Available"
                  message="You're not a member of any teams.\nVisit https://app.neo.khulnasoft.com to create or join a team."
                />
              ))
              return
            }

            // Show team selection dialog
            dialog.replace(() => (
              <DialogNeoTeamSelect
                organizations={profile.organizations!}
                currentOrgId={currentOrgId}
                hasPersonalAccount={profile.hasPersonalAccount !== false}
                onSelect={async (orgId) => {
                  try {
                    // Switch to team immediately using server endpoint
                    const result = await sdk.client.neo.organization.set({
                      organizationId: orgId,
                    })
                    if (result.error) {
                      toast.show({
                        message: "Failed to switch team",
                        variant: "error",
                      })
                      dialog.clear()
                      return
                    }

                    // Refresh provider state to reload models with new organization context
                    await sdk.client.instance.dispose()
                    await sync.bootstrap()

                    // Update the sidebar balance immediately for the newly selected account
                    refreshBalance()

                    // Show success toast
                    const teamName = orgId
                      ? profile.organizations!.find((o: Organization) => o.id === orgId)?.name
                      : "Personal"

                    toast.show({
                      message: `Switched to: ${teamName}`,
                      variant: "success",
                    })

                    // Close dialog
                    dialog.clear()
                  } catch (error) {
                    if (error instanceof DOMException && error.name === "AbortError") return
                    toast.show({
                      message: "Failed to switch team",
                      variant: "error",
                    })
                    dialog.clear()
                  }
                }}
              />
            ))
          } catch (error) {
            dialog.replace(() => <DialogAlert title="Error" message={`Failed to fetch teams: ${error}`} />)
          }
        },
      },
    ].map((command) => ({
      namespace: "palette",
      ...command,
    })),
  }))
}
