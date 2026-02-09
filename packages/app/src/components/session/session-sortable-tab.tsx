import { createMemo, Show } from "solid-js"
import type { JSX } from "solid-js"
import { createSortable } from "@thisbeyond/solid-dnd"
import { FileIcon } from "@neocode-ai/ui/file-icon"
import { IconButton } from "@neocode-ai/ui/icon-button"
import { TooltipKeybind } from "@neocode-ai/ui/tooltip"
import { Tabs } from "@neocode-ai/ui/tabs"
import { getFilename } from "@neocode-ai/util/path"
import { useFile } from "@/context/file"
import { useLanguage } from "@/context/language"
import { useCommand } from "@/context/command"

export function FileVisual(props: { path: string; active?: boolean }): JSX.Element {
  return (
    <div class="flex items-center gap-x-2 min-w-0 font-mono">
      <FileIcon
        node={{ path: props.path, type: "file" }}
        classList={{
          "grayscale-100 group-data-[selected]/tab:grayscale-0": !props.active,
          "grayscale-0": props.active,
        }}
      />
      <span class="text-[11px] font-bold truncate tracking-tight">{getFilename(props.path)}</span>
    </div>
  )
}

export function SortableTab(props: { tab: string; onTabClose: (tab: string) => void }): JSX.Element {
  const file = useFile()
  const language = useLanguage()
  const command = useCommand()
  const sortable = createSortable(props.tab)
  const path = createMemo(() => file.pathFromTab(props.tab))
  return (
    // @ts-ignore
    <div use:sortable classList={{ "h-full": true, "opacity-0": sortable.isActiveDraggable }}>
      <div class="relative h-full flex items-center">
        <Tabs.Trigger
          value={props.tab}
          class="!bg-[#0A0A0A] !border-[#1A1A1A] !rounded-none !h-full px-4 group data-[selected]:!bg-[#1A1A1A] data-[selected]:!border-b-[#A3BE8C]"
          closeButton={
            <TooltipKeybind
              title={language.t("common.closeTab")}
              keybind={command.keybind("tab.close")}
              placement="bottom"
            >
              <IconButton
                icon="close-small"
                variant="ghost"
                class="hidden group-hover:flex h-4 w-4 text-[#4A4A4A] hover:text-[#BF616A]"
                onClick={() => props.onTabClose(props.tab)}
                aria-label={language.t("common.closeTab")}
              />
            </TooltipKeybind>
          }
          hideCloseButton
          onMiddleClick={() => props.onTabClose(props.tab)}
        >
          <Show when={path()}>{(p) => <FileVisual path={p()} />}</Show>
        </Tabs.Trigger>
      </div>
    </div>
  )
}
