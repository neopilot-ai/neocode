import { useFilteredList } from "@neocode-ai/ui/hooks"
import { ProviderIcon } from "@neocode-ai/ui/provider-icon"
import { Switch } from "@neocode-ai/ui/switch"
import { Icon } from "@neocode-ai/ui/icon"
import { IconButton } from "@neocode-ai/ui/icon-button"
import type { IconName } from "@neocode-ai/ui/icons/provider"
import { type Component, For, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useModels } from "@/context/models"
import { popularProviders } from "@/hooks/use-providers"

type ModelItem = ReturnType<ReturnType<typeof useModels>["list"]>[number]

export const SettingsModels: Component = () => {
  const language = useLanguage()
  const models = useModels()

  const list = useFilteredList<ModelItem>({
    items: (_filter) => models.list(),
    key: (x) => `${x.provider.id}:${x.id}`,
    filterKeys: ["provider.name", "name", "id"],
    sortBy: (a, b) => a.name.localeCompare(b.name),
    groupBy: (x) => x.provider.id,
    sortGroupsBy: (a, b) => {
      const aIndex = popularProviders.indexOf(a.category)
      const bIndex = popularProviders.indexOf(b.category)
      const aPopular = aIndex >= 0
      const bPopular = bIndex >= 0

      if (aPopular && !bPopular) return -1
      if (!aPopular && bPopular) return 1
      if (aPopular && bPopular) return aIndex - bIndex

      const aName = a.items[0].provider.name
      const bName = b.items[0].provider.name
      return aName.localeCompare(bName)
    },
  })

  return (
    <div class="flex flex-col h-full font-mono text-[#E0E0E0]">
      <div class="sticky top-0 z-10 bg-[#050505] border-b border-[#1A1A1A] px-8 py-6">
        <h2 class="text-xs font-bold text-[#E0E0E0] uppercase tracking-[0.2em] flex items-center gap-4 mb-6">
          <span class="text-[#D08770]">///</span> {language.t("settings.models.title")}
        </h2>

        <div class="flex items-center gap-4">
          <div class="flex-1 flex items-center gap-3 px-3 h-10 bg-[#0A0A0A] border border-[#1A1A1A] focus-within:border-[#D08770] transition-colors">
            <Icon name="magnifying-glass" class="text-[#4A4A4A] size-4 flex-shrink-0" />
            <input
              type="text"
              value={list.filter()}
              onInput={(e) => list.onInput(e.currentTarget.value)}
              placeholder={language.t("dialog.model.search.placeholder")}
              spellcheck={false}
              class="flex-1 bg-transparent border-none outline-none text-xs text-[#E0E0E0] placeholder:text-[#4A4A4A]"
            />
            <Show when={list.filter()}>
              <button onClick={list.clear} class="text-[#4A4A4A] hover:text-[#E0E0E0]">
                <Icon name="circle-x" class="size-4" />
              </button>
            </Show>
          </div>
        </div>
      </div>

      <div class="p-8 pb-20 space-y-12 max-w-4xl">
        <Show
          when={!list.grouped.loading}
          fallback={
            <div class="flex flex-col items-center justify-center py-12 text-center text-[#666] animate-pulse">
              <span class="text-xs uppercase tracking-wider">{language.t("common.loading")}...</span>
            </div>
          }
        >
          <Show
            when={list.flat().length > 0}
            fallback={
              <div class="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[#1A1A1A] rounded-lg">
                <span class="text-xs text-[#666] uppercase tracking-wide">{language.t("dialog.model.empty")}</span>
                <Show when={list.filter()}>
                  <span class="text-xs text-[#E0E0E0] font-bold mt-2">&quot;{list.filter()}&quot;</span>
                </Show>
              </div>
            }
          >
            <div class="space-y-8">
              <For each={list.grouped.latest}>
                {(group) => (
                  <div class="space-y-4">
                    <div class="flex items-center gap-2">
                      <div class="p-1 border border-[#1A1A1A] bg-[#0A0A0A] rounded">
                        <ProviderIcon id={group.category as IconName} class="size-4 shrink-0" />
                      </div>
                      <h3 class="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em]">{group.items[0].provider.name}</h3>
                    </div>

                    <div class="border border-[#1A1A1A] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
                      <For each={group.items}>
                        {(item) => {
                          const key = { providerID: item.provider.id, modelID: item.id }
                          return (
                            <div class="flex flex-wrap items-center justify-between gap-4 p-3 hover:bg-[#111] transition-colors group">
                              <div class="min-w-0">
                                <span class="text-xs font-bold text-[#E0E0E0] group-hover:text-white transition-colors block">{item.name}</span>
                                <span class="text-[10px] text-[#4A4A4A] font-mono">{item.id}</span>
                              </div>
                              <div class="flex-shrink-0">
                                <Switch
                                  checked={models.visible(key)}
                                  onChange={(checked) => {
                                    models.setVisibility(key, checked)
                                  }}
                                  hideLabel
                                >
                                  {item.name}
                                </Switch>
                              </div>
                            </div>
                          )
                        }}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  )
}
