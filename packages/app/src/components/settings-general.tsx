import { Component, createMemo, type JSX } from "solid-js"
import { createStore } from "solid-js/store"
import { Button } from "@neocode-ai/ui/button"
import { Select } from "@neocode-ai/ui/select"
import { Switch } from "@neocode-ai/ui/switch"
import { useTheme, type ColorScheme } from "@neocode-ai/ui/theme"
import { showToast } from "@neocode-ai/ui/toast"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useSettings, monoFontFamily } from "@/context/settings"
import { playSound, SOUND_OPTIONS } from "@/utils/sound"
import { Link } from "./link"

let demoSoundState = {
  cleanup: undefined as (() => void) | undefined,
  timeout: undefined as NodeJS.Timeout | undefined,
}

const playDemoSound = (src: string) => {
  if (demoSoundState.cleanup) {
    demoSoundState.cleanup()
  }

  clearTimeout(demoSoundState.timeout)

  demoSoundState.timeout = setTimeout(() => {
    demoSoundState.cleanup = playSound(src)
  }, 100)
}

export const SettingsGeneral: Component = () => {
  const theme = useTheme()
  const language = useLanguage()
  const platform = usePlatform()
  const settings = useSettings()

  const [store, setStore] = createStore({
    checking: false,
  })

  const check = () => {
    if (!platform.checkUpdate) return
    setStore("checking", true)

    void platform
      .checkUpdate()
      .then((result) => {
        if (!result.updateAvailable) {
          showToast({
            variant: "success",
            icon: "circle-check",
            title: language.t("settings.updates.toast.latest.title"),
            description: language.t("settings.updates.toast.latest.description", { version: platform.version ?? "" }),
          })
          return
        }

        const actions =
          platform.update && platform.restart
            ? [
              {
                label: language.t("toast.update.action.installRestart"),
                onClick: async () => {
                  await platform.update!()
                  await platform.restart!()
                },
              },
              {
                label: language.t("toast.update.action.notYet"),
                onClick: "dismiss" as const,
              },
            ]
            : [
              {
                label: language.t("toast.update.action.notYet"),
                onClick: "dismiss" as const,
              },
            ]

        showToast({
          persistent: true,
          icon: "download",
          title: language.t("toast.update.title"),
          description: language.t("toast.update.description", { version: result.version ?? "" }),
          actions,
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        showToast({ title: language.t("common.requestFailed"), description: message })
      })
      .finally(() => setStore("checking", false))
  }

  const themeOptions = createMemo(() =>
    Object.entries(theme.themes()).map(([id, def]) => ({ id, name: def.name ?? id })),
  )

  const colorSchemeOptions = createMemo((): { value: ColorScheme; label: string }[] => [
    { value: "system", label: language.t("theme.scheme.system") },
    { value: "light", label: language.t("theme.scheme.light") },
    { value: "dark", label: language.t("theme.scheme.dark") },
  ])

  const languageOptions = createMemo(() =>
    language.locales.map((locale) => ({
      value: locale,
      label: language.label(locale),
    })),
  )

  const fontOptions = [
    { value: "ibm-plex-mono", label: "font.option.ibmPlexMono" },
    { value: "cascadia-code", label: "font.option.cascadiaCode" },
    { value: "fira-code", label: "font.option.firaCode" },
    { value: "hack", label: "font.option.hack" },
    { value: "inconsolata", label: "font.option.inconsolata" },
    { value: "intel-one-mono", label: "font.option.intelOneMono" },
    { value: "iosevka", label: "font.option.iosevka" },
    { value: "jetbrains-mono", label: "font.option.jetbrainsMono" },
    { value: "meslo-lgs", label: "font.option.mesloLgs" },
    { value: "roboto-mono", label: "font.option.robotoMono" },
    { value: "source-code-pro", label: "font.option.sourceCodePro" },
    { value: "ubuntu-mono", label: "font.option.ubuntuMono" },
  ] as const
  const fontOptionsList = [...fontOptions]

  const soundOptions = [...SOUND_OPTIONS]

  return (
    <div class="flex flex-col h-full font-mono text-[#E0E0E0]">
      <div class="sticky top-0 z-10 bg-[#050505] border-b border-[#1A1A1A] px-8 py-6">
        <h2 class="text-xs font-bold text-[#E0E0E0] uppercase tracking-[0.2em] flex items-center gap-4">
          <span class="text-[#A3BE8C]">///</span> {language.t("settings.tab.general")}
        </h2>
      </div>

      <div class="p-8 pb-20 space-y-12 max-w-4xl">
        {/* Appearance Section */}
        <section class="space-y-4">
          <SectionHeader title={language.t("settings.general.section.appearance")} color="#88C0D0" />

          <div class="border border-[#1A1A1A] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
            <SettingsRow
              title={language.t("settings.general.row.language.title")}
              description={language.t("settings.general.row.language.description")}
            >
              <Select
                data-action="settings-language"
                options={languageOptions()}
                current={languageOptions().find((o) => o.value === language.locale())}
                value={(o) => o.value}
                label={(o) => o.label}
                onSelect={(option) => option && language.setLocale(option.value)}
                class="w-48"
              />
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.general.row.appearance.title")}
              description={language.t("settings.general.row.appearance.description")}
            >
              <Select
                data-action="settings-color-scheme"
                options={colorSchemeOptions()}
                current={colorSchemeOptions().find((o) => o.value === theme.colorScheme())}
                value={(o) => o.value}
                label={(o) => o.label}
                onSelect={(option) => option && theme.setColorScheme(option.value)}
                onHighlight={(option) => {
                  if (!option) return
                  theme.previewColorScheme(option.value)
                  return () => theme.cancelPreview()
                }}
                class="w-48"
              />
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.general.row.theme.title")}
              description={
                <>
                  {language.t("settings.general.row.theme.description")}{" "}
                  <Link href="https://neo.khulnasoft.com/docs/themes/">{language.t("common.learnMore")}</Link>
                </>
              }
            >
              <Select
                data-action="settings-theme"
                options={themeOptions()}
                current={themeOptions().find((o) => o.id === theme.themeId())}
                value={(o) => o.id}
                label={(o) => o.name}
                onSelect={(option) => {
                  if (!option) return
                  theme.setTheme(option.id)
                }}
                onHighlight={(option) => {
                  if (!option) return
                  theme.previewTheme(option.id)
                  return () => theme.cancelPreview()
                }}
                class="w-48"
              />
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.general.row.font.title")}
              description={language.t("settings.general.row.font.description")}
            >
              <Select
                data-action="settings-font"
                options={fontOptionsList}
                current={fontOptionsList.find((o) => o.value === settings.appearance.font())}
                value={(o) => o.value}
                label={(o) => language.t(o.label)}
                onSelect={(option) => option && settings.appearance.setFont(option.value)}
                triggerStyle={{ "font-family": monoFontFamily(settings.appearance.font()), "min-width": "180px" }}
                class="w-48"
              >
                {(option) => (
                  <span style={{ "font-family": monoFontFamily(option?.value) }}>
                    {option ? language.t(option.label) : ""}
                  </span>
                )}
              </Select>
            </SettingsRow>
          </div>
        </section>

        {/* System notifications Section */}
        <section class="space-y-4">
          <SectionHeader title={language.t("settings.general.section.notifications")} color="#B48EAD" />

          <div class="border border-[#1A1A1A] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
            <SettingsRow
              title={language.t("settings.general.notifications.agent.title")}
              description={language.t("settings.general.notifications.agent.description")}
            >
              <div data-action="settings-notifications-agent">
                <Switch
                  checked={settings.notifications.agent()}
                  onChange={(checked) => settings.notifications.setAgent(checked)}
                />
              </div>
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.general.notifications.permissions.title")}
              description={language.t("settings.general.notifications.permissions.description")}
            >
              <div data-action="settings-notifications-permissions">
                <Switch
                  checked={settings.notifications.permissions()}
                  onChange={(checked) => settings.notifications.setPermissions(checked)}
                />
              </div>
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.general.notifications.errors.title")}
              description={language.t("settings.general.notifications.errors.description")}
            >
              <div data-action="settings-notifications-errors">
                <Switch
                  checked={settings.notifications.errors()}
                  onChange={(checked) => settings.notifications.setErrors(checked)}
                />
              </div>
            </SettingsRow>
          </div>
        </section>


        {/* Sound effects Section */}
        <section class="space-y-4">
          <SectionHeader title={language.t("settings.general.section.sounds")} color="#EBCB8B" />

          <div class="border border-[#1A1A1A] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
            <SettingsRow
              title={language.t("settings.general.sounds.agent.title")}
              description={language.t("settings.general.sounds.agent.description")}
            >
              <Select
                data-action="settings-sounds-agent"
                options={soundOptions}
                current={soundOptions.find((o) => o.id === settings.sounds.agent())}
                value={(o) => o.id}
                label={(o) => language.t(o.label)}
                onHighlight={(option) => {
                  if (!option) return
                  playDemoSound(option.src)
                }}
                onSelect={(option) => {
                  if (!option) return
                  settings.sounds.setAgent(option.id)
                  playDemoSound(option.src)
                }}
                class="w-48"
              />
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.general.sounds.permissions.title")}
              description={language.t("settings.general.sounds.permissions.description")}
            >
              <Select
                data-action="settings-sounds-permissions"
                options={soundOptions}
                current={soundOptions.find((o) => o.id === settings.sounds.permissions())}
                value={(o) => o.id}
                label={(o) => language.t(o.label)}
                onHighlight={(option) => {
                  if (!option) return
                  playDemoSound(option.src)
                }}
                onSelect={(option) => {
                  if (!option) return
                  settings.sounds.setPermissions(option.id)
                  playDemoSound(option.src)
                }}
                class="w-48"
              />
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.general.sounds.errors.title")}
              description={language.t("settings.general.sounds.errors.description")}
            >
              <Select
                data-action="settings-sounds-errors"
                options={soundOptions}
                current={soundOptions.find((o) => o.id === settings.sounds.errors())}
                value={(o) => o.id}
                label={(o) => language.t(o.label)}
                onHighlight={(option) => {
                  if (!option) return
                  playDemoSound(option.src)
                }}
                onSelect={(option) => {
                  if (!option) return
                  settings.sounds.setErrors(option.id)
                  playDemoSound(option.src)
                }}
                class="w-48"
              />
            </SettingsRow>
          </div>
        </section>

        {/* Updates Section */}
        <section class="space-y-4">
          <SectionHeader title={language.t("settings.general.section.updates")} color="#BF616A" />

          <div class="border border-[#1A1A1A] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
            <SettingsRow
              title={language.t("settings.updates.row.startup.title")}
              description={language.t("settings.updates.row.startup.description")}
            >
              <div data-action="settings-updates-startup">
                <Switch
                  checked={settings.updates.startup()}
                  disabled={!platform.checkUpdate}
                  onChange={(checked) => settings.updates.setStartup(checked)}
                />
              </div>
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.general.row.releaseNotes.title")}
              description={language.t("settings.general.row.releaseNotes.description")}
            >
              <div data-action="settings-release-notes">
                <Switch
                  checked={settings.general.releaseNotes()}
                  onChange={(checked) => settings.general.setReleaseNotes(checked)}
                />
              </div>
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.updates.row.check.title")}
              description={language.t("settings.updates.row.check.description")}
            >
              <Button
                size="small"
                variant="ghost"
                class="border border-[#1A1A1A] hover:bg-[#1A1A1A] text-xs font-bold uppercase tracking-wide"
                disabled={store.checking || !platform.checkUpdate}
                onClick={check}
              >
                {store.checking
                  ? language.t("settings.updates.action.checking")
                  : language.t("settings.updates.action.checkNow")}
              </Button>
            </SettingsRow>
          </div>
        </section>
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

interface SettingsRowProps {
  title: string
  description: string | JSX.Element
  children: JSX.Element
}

const SettingsRow: Component<SettingsRowProps> = (props) => {
  return (
    <div class="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-[#111] transition-colors group">
      <div class="flex flex-col gap-1 min-w-0 max-w-[70%]">
        <span class="text-xs font-bold text-[#E0E0E0] group-hover:text-white transition-colors">{props.title}</span>
        <span class="text-[11px] text-[#666] leading-relaxed">{props.description}</span>
      </div>
      <div class="flex-shrink-0">{props.children}</div>
    </div>
  )
}
