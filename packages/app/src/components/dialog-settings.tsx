import { Component } from "solid-js"
import { Dialog } from "@neocode-ai/ui/dialog"
import { Tabs } from "@neocode-ai/ui/tabs"
import { Icon, type IconProps } from "@neocode-ai/ui/icon"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { SettingsGeneral } from "./settings-general"
import { SettingsKeybinds } from "./settings-keybinds"
import { SettingsProviders } from "./settings-providers"
import { SettingsModels } from "./settings-models"

export const DialogSettings: Component = () => {
  const language = useLanguage()
  const platform = usePlatform()

  return (
    <Dialog size="x-large" transition class="bg-[#050505] border border-[#1A1A1A] p-0 overflow-hidden font-mono text-[#E0E0E0]">
      <Tabs orientation="vertical" variant="settings" defaultValue="general" class="h-full flex divide-x divide-[#1A1A1A]">
        <Tabs.List class="w-64 bg-[#0A0A0A] p-0 flex flex-col justify-between shrink-0">
          <div class="flex flex-col gap-6 p-4">
            <div class="text-[10px] font-bold text-[#4A4A4A] tracking-[0.2em] border-b border-[#1A1A1A] pb-2 mb-2">
              SYSTEM_CONFIG
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <Tabs.SectionTitle class="text-[9px] font-bold text-[#88C0D0] uppercase tracking-wider pl-2">
                  {language.t("settings.section.desktop")}
                </Tabs.SectionTitle>
                <div class="space-y-0.5">
                  <TabTrigger value="general" icon="sliders" label={language.t("settings.tab.general")} />
                  <TabTrigger value="shortcuts" icon="keyboard" label={language.t("settings.tab.shortcuts")} />
                </div>
              </div>

              <div class="space-y-2">
                <Tabs.SectionTitle class="text-[9px] font-bold text-[#B48EAD] uppercase tracking-wider pl-2">
                  {language.t("settings.section.server")}
                </Tabs.SectionTitle>
                <div class="space-y-0.5">
                  <TabTrigger value="providers" icon="providers" label={language.t("settings.providers.title")} />
                  <TabTrigger value="models" icon="models" label={language.t("settings.models.title")} />
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-[#1A1A1A]">
            <div class="flex flex-col gap-1 text-[10px] font-bold text-[#4A4A4A]">
              <span class="uppercase tracking-wider">{language.t("app.name.desktop")}</span>
              <span class="text-[#A3BE8C]">v{platform.version}</span>
            </div>
          </div>
        </Tabs.List>

        <div class="flex-1 bg-[#050505] relative overflow-hidden">
          <Tabs.Content value="general" class="h-full overflow-y-auto custom-scrollbar p-0 outline-none">
            <SettingsGeneral />
          </Tabs.Content>
          <Tabs.Content value="shortcuts" class="h-full overflow-y-auto custom-scrollbar p-0 outline-none">
            <SettingsKeybinds />
          </Tabs.Content>
          <Tabs.Content value="providers" class="h-full overflow-y-auto custom-scrollbar p-0 outline-none">
            <SettingsProviders />
          </Tabs.Content>
          <Tabs.Content value="models" class="h-full overflow-y-auto custom-scrollbar p-0 outline-none">
            <SettingsModels />
          </Tabs.Content>
        </div>
      </Tabs>
    </Dialog>
  )
}

function TabTrigger(props: { value: string; icon: IconProps["name"]; label: string }) {
  return (
    <Tabs.Trigger
      value={props.value}
      class="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-[#666] hover:text-[#E0E0E0] hover:bg-[#111] transition-colors data-[selected]:text-[#A3BE8C] data-[selected]:bg-[#1A1A1A]/50 outline-none"
    >
      <Icon name={props.icon} class="size-4 opacity-70" />
      <span class="uppercase tracking-tight">{props.label}</span>
      <div class="ml-auto w-1 h-1 rounded-full bg-current opacity-0 data-[selected]:opacity-100" />
    </Tabs.Trigger>
  )
}
