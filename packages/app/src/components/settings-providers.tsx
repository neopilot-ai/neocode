import { Button } from "@neocode-ai/ui/button"
import { useDialog } from "@neocode-ai/ui/context/dialog"
import { ProviderIcon } from "@neocode-ai/ui/provider-icon"
import { showToast } from "@neocode-ai/ui/toast"
import { iconNames, type IconName } from "@neocode-ai/ui/icons/provider"
import { popularProviders, useProviders } from "@/hooks/use-providers"
import { createMemo, type Component, For, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { DialogConnectProvider } from "./dialog-connect-provider"
import { DialogSelectProvider } from "./dialog-select-provider"
import { DialogCustomProvider } from "./dialog-custom-provider"
import { Icon } from "@neocode-ai/ui/icon"

type ProviderSource = "env" | "api" | "config" | "custom"
type ProviderMeta = { source?: ProviderSource }

export const SettingsProviders: Component = () => {
  const dialog = useDialog()
  const language = useLanguage()
  const globalSDK = useGlobalSDK()
  const globalSync = useGlobalSync()
  const providers = useProviders()

  const icon = (id: string): IconName => {
    if (iconNames.includes(id as IconName)) return id as IconName
    return "synthetic"
  }

  const connected = createMemo(() => {
    return providers.connected().filter((p) => p.id !== "neocode" || Object.values(p.models).find((m) => m.cost?.input))
  })

  const popular = createMemo(() => {
    const connectedIDs = new Set(connected().map((p) => p.id))
    const items = providers
      .popular()
      .filter((p) => !connectedIDs.has(p.id))
      .slice()
    items.sort((a, b) => popularProviders.indexOf(a.id) - popularProviders.indexOf(b.id))
    return items
  })

  const source = (item: unknown) => (item as ProviderMeta).source

  const type = (item: unknown) => {
    const current = source(item)
    if (current === "env") return "ENV"
    if (current === "api") return "API KEY"
    if (current === "config") {
      const id = (item as { id?: string }).id
      if (id && isConfigCustom(id)) return "CUSTOM"
      return "CONFIG"
    }
    if (current === "custom") return "CUSTOM"
    return "OTHER"
  }

  const canDisconnect = (item: unknown) => source(item) !== "env"

  const isConfigCustom = (providerID: string) => {
    const provider = globalSync.data.config.provider?.[providerID]
    if (!provider) return false
    if (provider.npm !== "@ai-sdk/openai-compatible") return false
    if (!provider.models || Object.keys(provider.models).length === 0) return false
    return true
  }

  const disableProvider = async (providerID: string, name: string) => {
    const before = globalSync.data.config.disabled_providers ?? []
    const next = before.includes(providerID) ? before : [...before, providerID]
    globalSync.set("config", "disabled_providers", next)

    await globalSync
      .updateConfig({ disabled_providers: next })
      .then(() => {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: language.t("provider.disconnect.toast.disconnected.title", { provider: name }),
          description: language.t("provider.disconnect.toast.disconnected.description", { provider: name }),
        })
      })
      .catch((err: unknown) => {
        globalSync.set("config", "disabled_providers", before)
        const message = err instanceof Error ? err.message : String(err)
        showToast({ title: language.t("common.requestFailed"), description: message })
      })
  }

  const disconnect = async (providerID: string, name: string) => {
    if (isConfigCustom(providerID)) {
      await globalSDK.client.auth.remove({ providerID }).catch(() => undefined)
      await disableProvider(providerID, name)
      return
    }
    await globalSDK.client.auth
      .remove({ providerID })
      .then(async () => {
        await globalSDK.client.global.dispose()
        showToast({
          variant: "success",
          icon: "circle-check",
          title: language.t("provider.disconnect.toast.disconnected.title", { provider: name }),
          description: language.t("provider.disconnect.toast.disconnected.description", { provider: name }),
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        showToast({ title: language.t("common.requestFailed"), description: message })
      })
  }

  return (
    <div class="flex flex-col h-full font-mono text-[#E0E0E0]">
      <div class="sticky top-0 z-10 bg-[#050505] border-b border-[#1A1A1A] px-8 py-6">
        <h2 class="text-xs font-bold text-[#E0E0E0] uppercase tracking-[0.2em] flex items-center gap-4">
          <span class="text-[#B48EAD]">///</span> {language.t("settings.providers.title")}
        </h2>
      </div>

      <div class="p-8 pb-20 space-y-12 max-w-4xl">
        <section class="space-y-4">
          <SectionHeader title={language.t("settings.providers.section.connected")} color="#A3BE8C" />

          <div class="border border-[#1A1A1A] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
            <Show
              when={connected().length > 0}
              fallback={
                <div class="p-8 text-center border-dashed border-[#1A1A1A]">
                  <span class="text-xs text-[#666]">{language.t("settings.providers.connected.empty")}</span>
                </div>
              }
            >
              <For each={connected()}>
                {(item) => (
                  <div class="group flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-[#111] transition-colors">
                    <div class="flex items-center gap-4 min-w-0">
                      <div class="p-2 border border-[#1A1A1A] bg-[#050505] rounded">
                        <ProviderIcon id={icon(item.id)} class="size-5 shrink-0" />
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-bold text-[#E0E0E0] uppercase tracking-wide">{item.name}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-[9px] text-[#B48EAD] font-bold uppercase border border-[#B48EAD]/30 bg-[#B48EAD]/10 px-1.5 py-0.5 rounded-sm">
                            {type(item)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Show
                      when={canDisconnect(item)}
                      fallback={
                        <span class="text-[10px] text-[#666] uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity cursor-default flex items-center gap-2">
                          <Icon name="circle-ban-sign" class="size-3" />
                          Managed by ENV
                        </span>
                      }
                    >
                      <Button
                        size="small"
                        variant="ghost"
                        class="text-[#BF616A] hover:text-[#BF616A] hover:bg-[#BF616A]/10 text-[10px] uppercase font-bold tracking-wide border border-transparent hover:border-[#BF616A]/20"
                        onClick={() => void disconnect(item.id, item.name)}
                      >
                        {language.t("common.disconnect")}
                      </Button>
                    </Show>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </section>

        <section class="space-y-4">
          <SectionHeader title={language.t("settings.providers.section.popular")} color="#88C0D0" />

          <div class="border border-[#1A1A1A] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
            <For each={popular()}>
              {(item) => (
                <div class="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-[#111] transition-colors group">
                  <div class="flex items-center gap-4 min-w-0">
                    <div class="p-2 border border-[#1A1A1A] bg-[#050505] rounded opacity-70 group-hover:opacity-100 transition-opacity">
                      <ProviderIcon id={icon(item.id)} class="size-5 shrink-0" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-[#E0E0E0] uppercase tracking-wide">{item.name}</span>
                        <Show when={item.id === "neocode"}>
                          <span class="text-[9px] text-[#A3BE8C] font-bold border border-[#A3BE8C]/30 bg-[#A3BE8C]/10 px-1 py-px rounded-sm">RECOMMENDED</span>
                        </Show>
                      </div>
                      <div class="text-[10px] text-[#666] leading-relaxed max-w-[400px]">
                        <Show when={item.id === "neocode"}>{language.t("dialog.provider.neocode.note")}</Show>
                        <Show when={item.id === "anthropic"}>{language.t("dialog.provider.anthropic.note")}</Show>
                        <Show when={item.id.startsWith("github-copilot")}>{language.t("dialog.provider.copilot.note")}</Show>
                        <Show when={item.id === "openai"}>{language.t("dialog.provider.openai.note")}</Show>
                        <Show when={item.id === "google"}>{language.t("dialog.provider.google.note")}</Show>
                        <Show when={item.id === "openrouter"}>{language.t("dialog.provider.openrouter.note")}</Show>
                        <Show when={item.id === "vercel"}>{language.t("dialog.provider.vercel.note")}</Show>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="small"
                    variant="ghost"
                    class="border border-[#1A1A1A] hover:bg-[#1A1A1A] text-xs font-bold uppercase tracking-wide text-[#E0E0E0]"
                    onClick={() => {
                      dialog.show(() => <DialogConnectProvider provider={item.id} />)
                    }}
                  >
                    <div class="flex items-center gap-2">
                      <Icon name="plus-small" class="size-4" />
                      {language.t("common.connect")}
                    </div>
                  </Button>
                </div>
              )}
            </For>

            <div class="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-[#111] transition-colors group">
              <div class="flex items-center gap-4 min-w-0">
                <div class="p-2 border border-[#1A1A1A] bg-[#050505] rounded opacity-70 group-hover:opacity-100 transition-opacity">
                  <ProviderIcon id={icon("synthetic")} class="size-5 shrink-0" />
                </div>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-[#E0E0E0] uppercase tracking-wide">Custom Provider</span>
                    <span class="text-[9px] text-[#B48EAD] font-bold border border-[#B48EAD]/30 bg-[#B48EAD]/10 px-1 py-px rounded-sm">CUSTOM</span>
                  </div>
                  <span class="text-[10px] text-[#666]">Add an OpenAI-compatible provider by base URL.</span>
                </div>
              </div>
              <Button
                size="small"
                variant="ghost"
                class="border border-[#1A1A1A] hover:bg-[#1A1A1A] text-xs font-bold uppercase tracking-wide text-[#E0E0E0]"
                onClick={() => {
                  dialog.show(() => <DialogCustomProvider back="close" />)
                }}
              >
                <div class="flex items-center gap-2">
                  <Icon name="plus-small" class="size-4" />
                  {language.t("common.connect")}
                </div>
              </Button>
            </div>
          </div>
        </section>

        <div class="pt-4 border-t border-[#1A1A1A]">
          <Button
            variant="ghost"
            class="text-xs text-[#666] hover:text-[#E0E0E0] uppercase tracking-wider font-bold p-0 h-auto hover:bg-transparent"
            onClick={() => {
              dialog.show(() => <DialogSelectProvider />)
            }}
          >
            {language.t("dialog.provider.viewAll")} -&gt;
          </Button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader(props: { title: string; color: string }) {
  return (
    <div class="flex items-center gap-2">
      <div class="w-1 h-3" style={{ "background-color": props.color }} />
      <h3 class="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em]">{props.title}</h3>
    </div>
  )
}
