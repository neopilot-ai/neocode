import { Component, For, Show, createMemo, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { Button } from "@neocode-ai/ui/button"
import { Icon } from "@neocode-ai/ui/icon"
import { IconButton } from "@neocode-ai/ui/icon-button"
import { showToast } from "@neocode-ai/ui/toast"
import fuzzysort from "fuzzysort"
import { formatKeybind, parseKeybind, useCommand } from "@/context/command"
import { useLanguage } from "@/context/language"
import { useSettings } from "@/context/settings"

const IS_MAC = typeof navigator === "object" && /(Mac|iPod|iPhone|iPad)/.test(navigator.platform)
const PALETTE_ID = "command.palette"
const DEFAULT_PALETTE_KEYBIND = "mod+shift+p"

type KeybindGroup = "General" | "Session" | "Navigation" | "Model and agent" | "Terminal" | "Prompt"

type KeybindMeta = {
  title: string
  group: KeybindGroup
}

const GROUPS: KeybindGroup[] = ["General", "Session", "Navigation", "Model and agent", "Terminal", "Prompt"]

type GroupKey =
  | "settings.shortcuts.group.general"
  | "settings.shortcuts.group.session"
  | "settings.shortcuts.group.navigation"
  | "settings.shortcuts.group.modelAndAgent"
  | "settings.shortcuts.group.terminal"
  | "settings.shortcuts.group.prompt"

const groupKey: Record<KeybindGroup, GroupKey> = {
  General: "settings.shortcuts.group.general",
  Session: "settings.shortcuts.group.session",
  Navigation: "settings.shortcuts.group.navigation",
  "Model and agent": "settings.shortcuts.group.modelAndAgent",
  Terminal: "settings.shortcuts.group.terminal",
  Prompt: "settings.shortcuts.group.prompt",
}

const groupColor: Record<KeybindGroup, string> = {
  General: "#88C0D0", // Cyan
  Session: "#A3BE8C", // Green
  Navigation: "#EBCB8B", // Yellow
  "Model and agent": "#B48EAD", // Purple
  Terminal: "#D08770", // Orange
  Prompt: "#BF616A", // Red
}

function groupFor(id: string): KeybindGroup {
  if (id === PALETTE_ID) return "General"
  if (id.startsWith("terminal.")) return "Terminal"
  if (id.startsWith("model.") || id.startsWith("agent.") || id.startsWith("mcp.")) return "Model and agent"
  if (id.startsWith("file.")) return "Navigation"
  if (id.startsWith("prompt.")) return "Prompt"
  if (
    id.startsWith("session.") ||
    id.startsWith("message.") ||
    id.startsWith("permissions.") ||
    id.startsWith("steps.") ||
    id.startsWith("review.")
  )
    return "Session"

  return "General"
}

function isModifier(key: string) {
  return key === "Shift" || key === "Control" || key === "Alt" || key === "Meta"
}

function normalizeKey(key: string) {
  if (key === ",") return "comma"
  if (key === "+") return "plus"
  if (key === " ") return "space"
  return key.toLowerCase()
}

function recordKeybind(event: KeyboardEvent) {
  if (isModifier(event.key)) return

  const parts: string[] = []

  const mod = IS_MAC ? event.metaKey : event.ctrlKey
  if (mod) parts.push("mod")

  if (IS_MAC && event.ctrlKey) parts.push("ctrl")
  if (!IS_MAC && event.metaKey) parts.push("meta")
  if (event.altKey) parts.push("alt")
  if (event.shiftKey) parts.push("shift")

  const key = normalizeKey(event.key)
  if (!key) return
  parts.push(key)

  return parts.join("+")
}

function signatures(config: string | undefined) {
  if (!config) return []
  const sigs: string[] = []

  for (const kb of parseKeybind(config)) {
    const parts: string[] = []
    if (kb.ctrl) parts.push("ctrl")
    if (kb.alt) parts.push("alt")
    if (kb.shift) parts.push("shift")
    if (kb.meta) parts.push("meta")
    if (kb.key) parts.push(kb.key)
    if (parts.length === 0) continue
    sigs.push(parts.join("+"))
  }

  return sigs
}

export const SettingsKeybinds: Component = () => {
  const command = useCommand()
  const language = useLanguage()
  const settings = useSettings()

  const [store, setStore] = createStore({
    active: null as string | null,
    filter: "",
  })

  const stop = () => {
    if (!store.active) return
    setStore("active", null)
    command.keybinds(true)
  }

  const start = (id: string) => {
    if (store.active === id) {
      stop()
      return
    }

    if (store.active) stop()

    setStore("active", id)
    command.keybinds(false)
  }

  const hasOverrides = createMemo(() => {
    const keybinds = settings.current.keybinds as Record<string, string | undefined> | undefined
    if (!keybinds) return false
    return Object.values(keybinds).some((x) => typeof x === "string")
  })

  const resetAll = () => {
    stop()
    settings.keybinds.resetAll()
    showToast({
      title: language.t("settings.shortcuts.reset.toast.title"),
      description: language.t("settings.shortcuts.reset.toast.description"),
    })
  }

  const list = createMemo(() => {
    language.locale()
    const out = new Map<string, KeybindMeta>()
    out.set(PALETTE_ID, { title: language.t("command.palette"), group: "General" })

    for (const opt of command.catalog) {
      if (opt.id.startsWith("suggested.")) continue
      out.set(opt.id, { title: opt.title, group: groupFor(opt.id) })
    }

    for (const opt of command.options) {
      if (opt.id.startsWith("suggested.")) continue
      out.set(opt.id, { title: opt.title, group: groupFor(opt.id) })
    }

    const keybinds = settings.current.keybinds as Record<string, string | undefined> | undefined
    if (keybinds) {
      for (const [id, value] of Object.entries(keybinds)) {
        if (typeof value !== "string") continue
        if (out.has(id)) continue
        out.set(id, { title: id, group: groupFor(id) })
      }
    }

    return out
  })

  const title = (id: string) => list().get(id)?.title ?? ""

  const grouped = createMemo(() => {
    const map = list()
    const out = new Map<KeybindGroup, string[]>()

    for (const group of GROUPS) out.set(group, [])

    for (const [id, item] of map) {
      const ids = out.get(item.group)
      if (!ids) continue
      ids.push(id)
    }

    for (const group of GROUPS) {
      const ids = out.get(group)
      if (!ids) continue

      ids.sort((a, b) => {
        const at = map.get(a)?.title ?? ""
        const bt = map.get(b)?.title ?? ""
        return at.localeCompare(bt)
      })
    }

    return out
  })

  const filtered = createMemo(() => {
    const query = store.filter.toLowerCase().trim()
    if (!query) return grouped()

    const map = list()
    const out = new Map<KeybindGroup, string[]>()

    for (const group of GROUPS) out.set(group, [])

    const items = Array.from(map.entries()).map(([id, meta]) => ({
      id,
      title: meta.title,
      group: meta.group,
      keybind: command.keybind(id) || "",
    }))

    const results = fuzzysort.go(query, items, {
      keys: ["title", "keybind"],
      threshold: -10000,
    })

    for (const result of results) {
      const item = result.obj
      const ids = out.get(item.group)
      if (!ids) continue
      ids.push(item.id)
    }

    return out
  })

  const hasResults = createMemo(() => {
    for (const group of GROUPS) {
      const ids = filtered().get(group) ?? []
      if (ids.length > 0) return true
    }
    return false
  })

  const used = createMemo(() => {
    const map = new Map<string, { id: string; title: string }[]>()

    const add = (key: string, value: { id: string; title: string }) => {
      const list = map.get(key)
      if (!list) {
        map.set(key, [value])
        return
      }
      list.push(value)
    }

    const palette = settings.keybinds.get(PALETTE_ID) ?? DEFAULT_PALETTE_KEYBIND
    for (const sig of signatures(palette)) {
      add(sig, { id: PALETTE_ID, title: title(PALETTE_ID) })
    }

    const valueFor = (id: string) => {
      const custom = settings.keybinds.get(id)
      if (typeof custom === "string") return custom

      const live = command.options.find((x) => x.id === id)
      if (live?.keybind) return live.keybind

      const meta = command.catalog.find((x) => x.id === id)
      return meta?.keybind
    }

    for (const id of list().keys()) {
      if (id === PALETTE_ID) continue
      for (const sig of signatures(valueFor(id))) {
        add(sig, { id, title: title(id) })
      }
    }

    return map
  })

  const setKeybind = (id: string, keybind: string) => {
    settings.keybinds.set(id, keybind)
  }

  onMount(() => {
    const handle = (event: KeyboardEvent) => {
      const id = store.active
      if (!id) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      if (event.key === "Escape") {
        stop()
        return
      }

      const clear =
        (event.key === "Backspace" || event.key === "Delete") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      if (clear) {
        setKeybind(id, "none")
        stop()
        return
      }

      const next = recordKeybind(event)
      if (!next) return

      const map = used()
      const conflicts = new Map<string, string>()

      for (const sig of signatures(next)) {
        const list = map.get(sig) ?? []
        for (const item of list) {
          if (item.id === id) continue
          conflicts.set(item.id, item.title)
        }
      }

      if (conflicts.size > 0) {
        showToast({
          title: language.t("settings.shortcuts.conflict.title"),
          description: language.t("settings.shortcuts.conflict.description", {
            keybind: formatKeybind(next),
            titles: [...conflicts.values()].join(", "),
          }),
        })
        return
      }

      setKeybind(id, next)
      stop()
    }

    document.addEventListener("keydown", handle, true)
    onCleanup(() => {
      document.removeEventListener("keydown", handle, true)
    })
  })

  onCleanup(() => {
    if (store.active) command.keybinds(true)
  })

  return (
    <div class="flex flex-col h-full font-mono text-[#E0E0E0]">
      <div class="sticky top-0 z-10 bg-[#050505] border-b border-[#1A1A1A] px-8 py-6">
        <h2 class="text-xs font-bold text-[#E0E0E0] uppercase tracking-[0.2em] flex items-center gap-4 mb-6">
          <span class="text-[#88C0D0]">///</span> {language.t("settings.shortcuts.title")}
        </h2>

        <div class="flex flex-col gap-4">
          {/* Search & Actions Bar */}
          <div class="flex items-center gap-4">
            <div class="flex-1 flex items-center gap-3 px-3 h-10 bg-[#0A0A0A] border border-[#1A1A1A] focus-within:border-[#88C0D0] transition-colors">
              <Icon name="magnifying-glass" class="text-[#4A4A4A] size-4 flex-shrink-0" />
              <input
                type="text"
                value={store.filter}
                onInput={(e) => setStore("filter", e.currentTarget.value)}
                placeholder={language.t("settings.shortcuts.search.placeholder")}
                spellcheck={false}
                class="flex-1 bg-transparent border-none outline-none text-xs text-[#E0E0E0] placeholder:text-[#4A4A4A]"
              />
              <Show when={store.filter}>
                <button onClick={() => setStore("filter", "")} class="text-[#4A4A4A] hover:text-[#E0E0E0]">
                  <Icon name="circle-x" class="size-4" />
                </button>
              </Show>
            </div>

            <Button
              size="small"
              variant="ghost"
              onClick={resetAll}
              disabled={!hasOverrides()}
              class="border border-[#1A1A1A] hover:bg-[#1A1A1A] text-xs font-bold uppercase tracking-wide h-10 px-4"
            >
              {language.t("settings.shortcuts.reset.button")}
            </Button>
          </div>
        </div>
      </div>

      <div class="p-8 pb-20 space-y-12 max-w-4xl">
        <For each={GROUPS}>
          {(group) => (
            <Show when={(filtered().get(group) ?? []).length > 0}>
              <section class="space-y-4">
                <div class="flex items-center gap-2">
                  <div class="w-1 h-3" style={{ "background-color": groupColor[group] }} />
                  <h3 class="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em]">{language.t(groupKey[group])}</h3>
                </div>

                <div class="border border-[#1A1A1A] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
                  <For each={filtered().get(group) ?? []}>
                    {(id) => (
                      <div class="flex items-center justify-between gap-4 p-3 hover:bg-[#111] transition-colors group">
                        <span class="text-xs font-bold text-[#E0E0E0] group-hover:text-white transition-colors">{title(id)}</span>
                        <div
                          data-keybind-id={id}
                          class="cursor-pointer"
                          onClick={() => start(id)}
                        >
                          <Show
                            when={store.active === id}
                            fallback={
                              <div class="flex items-center gap-1">
                                <Show when={command.keybind(id)} fallback={
                                  <span class="text-[10px] uppercase tracking-wide text-[#4A4A4A]">{language.t("settings.shortcuts.unassigned")}</span>
                                }>
                                  {(k) => <KeybindDisplay keybind={k()} />}
                                </Show>
                              </div>
                            }
                          >
                            <div class="flex items-center gap-2 text-[#88C0D0] animate-pulse">
                              <span class="text-[10px] font-bold uppercase tracking-wider">{language.t("settings.shortcuts.pressKeys")}</span>
                              <Icon name="keyboard" class="size-4" />
                            </div>
                          </Show>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </Show>
          )}
        </For>

        <Show when={store.filter && !hasResults()}>
          <div class="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[#1A1A1A] rounded-lg">
            <span class="text-xs text-[#666]">{language.t("settings.shortcuts.search.empty")}</span>
            <Show when={store.filter}>
              <span class="text-xs text-[#E0E0E0] font-bold mt-2">"{store.filter}"</span>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  )
}

function KeybindDisplay(props: { keybind: string }) {
  const parts = createMemo(() => {
    return props.keybind.split("+").map(p => {
      if (p === "mod") return IS_MAC ? "CMD" : "CTRL"
      if (p === "ctrl") return "CTRL"
      if (p === "shift") return "SHIFT"
      if (p === "alt") return "ALT"
      if (p === "meta") return "META"
      return p.toUpperCase()
    })
  })

  return (
    <div class="flex items-center gap-1.5">
      <For each={parts()}>
        {(part, i) => (
          <>
            <span class="px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-[10px] font-bold text-[#A3BE8C] font-mono min-w-[24px] text-center shadow-sm">
              {part}
            </span>
            <Show when={i() < parts.length - 1}>
              <span class="text-[#4A4A4A] text-[10px]">+</span>
            </Show>
          </>
        )}
      </For>
    </div>
  )
}
