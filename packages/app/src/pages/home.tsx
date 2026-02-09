import { createMemo, createSignal, For, Match, onCleanup, onMount, Switch } from "solid-js"
import { Button } from "@neocode-ai/ui/button"
import { Logo } from "@neocode-ai/ui/logo"
import { useLayout } from "@/context/layout"
import { useNavigate } from "@solidjs/router"
import { base64Encode } from "@neocode-ai/util/encode"
import { Icon } from "@neocode-ai/ui/icon"
import { usePlatform } from "@/context/platform"
import { DateTime } from "luxon"
import { useDialog } from "@neocode-ai/ui/context/dialog"
import { DialogSelectDirectory } from "@/components/dialog-select-directory"
import { DialogSelectServer } from "@/components/dialog-select-server"
import { useServer } from "@/context/server"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"

export default function Home() {
  const sync = useGlobalSync()
  const layout = useLayout()
  const platform = usePlatform()
  const dialog = useDialog()
  const navigate = useNavigate()
  const server = useServer()
  const language = useLanguage()
  const homedir = createMemo(() => sync.data.path.home)

  const [time, setTime] = createSignal(DateTime.now().toFormat("HH:mm:ss"))
  onMount(() => {
    const interval = setInterval(() => setTime(DateTime.now().toFormat("HH:mm:ss")), 1000)
    onCleanup(() => clearInterval(interval))
  })

  const recent = createMemo(() => {
    return sync.data.project
      .toSorted((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created))
      .slice(0, 4)
  })

  function openProject(directory: string) {
    layout.projects.open(directory)
    server.projects.touch(directory)
    navigate(`/${base64Encode(directory)}`)
  }

  async function chooseProject() {
    function resolve(result: string | string[] | null) {
      if (Array.isArray(result)) {
        for (const directory of result) {
          openProject(directory)
        }
      } else if (result) {
        openProject(result)
      }
    }

    if (platform.openDirectoryPickerDialog && server.isLocal()) {
      const result = await platform.openDirectoryPickerDialog?.({
        title: language.t("command.project.open"),
        multiple: true,
      })
      resolve(result)
    } else {
      dialog.show(
        () => <DialogSelectDirectory multiple={true} onSelect={resolve} />,
        () => resolve(null),
      )
    }
  }

  return (
    <div class="h-screen bg-[#050505] text-[#E0E0E0] font-mono flex flex-col overflow-hidden">
      {/* Top Console Bar */}
      <header class="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-3">
            <Logo class="w-8 h-8 text-[#A3BE8C]" />
            <span class="font-bold tracking-tighter text-sm">MISSION_CONTROL_v1.1</span>
          </div>
          <div class="hidden md:flex items-center gap-6 text-[10px] text-[#4A4A4A] uppercase tracking-widest">
            <span>Uptime: 412h</span>
            <span>OS: {platform.os}</span>
            <div class="flex items-center gap-2">
              <div
                classList={{
                  "size-1.5 rounded-full": true,
                  "bg-[#A3BE8C]": server.healthy() === true,
                  "bg-[#BF616A]": server.healthy() === false,
                  "bg-[#4A4A4A]": server.healthy() === undefined,
                }}
              />
              <span class={server.healthy() ? "text-[#A3BE8C]" : "text-[#BF616A]"}>
                SRV: {server.name.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4 text-[10px] font-medium text-[#4A4A4A]">
          <span class="text-[#A3BE8C]">● SYNCHRONIZED</span>
          <span class="text-[#E0E0E0]">{time()}</span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto custom-scrollbar p-8 grid grid-cols-1 xl:grid-cols-12 gap-12 max-w-[1600px] mx-auto w-full">
        {/* Left Column: Ops Centers (Projects) */}
        <div class="xl:col-span-8 space-y-12">
          <section>
            <div class="flex items-center justify-between mb-8 border-b border-[#1A1A1A] pb-4">
              <div class="flex items-center gap-3">
                <span class="w-1 h-5 bg-[#A3BE8C]"></span>
                <h2 class="text-sm font-bold uppercase tracking-[0.2em]">{language.t("home.recentProjects")}</h2>
              </div>
              <Button
                variant="ghost"
                class="text-[10px] uppercase text-[#4A4A4A] hover:text-[#E0E0E0]"
                onClick={chooseProject}
              >
                [+] OPEN_NEW_WORKSPACE
              </Button>
            </div>

            <Switch>
              <Match when={sync.data.project.length > 0}>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <For each={recent()}>
                    {(project) => (
                      <button
                        class="group text-left border border-[#1A1A1A] bg-[#0A0A0A] p-6 rounded-sm hover:border-[#A3BE8C]/50 transition-all duration-300 relative overflow-hidden"
                        onClick={() => openProject(project.worktree)}
                      >
                        <div class="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
                          <Icon name="folder" class="w-16 h-16" />
                        </div>
                        <div class="relative z-10 space-y-4">
                          <div class="flex items-center justify-between">
                            <span class="text-[9px] text-[#4A4A4A] uppercase tracking-tighter">PROJECT_ID: {base64Encode(project.worktree).substring(0, 8)}</span>
                            <span class="text-[9px] text-[#A3BE8C] uppercase">{DateTime.fromMillis(project.time.updated ?? project.time.created).toRelative()}</span>
                          </div>
                          <h3 class="text-lg font-light tracking-tight truncate text-[#E0E0E0] group-hover:text-[#A3BE8C] transition-colors">
                            {project.worktree.replace(homedir(), "~")}
                          </h3>
                          <div class="flex gap-4 pt-2 border-t border-[#1A1A1A]">
                            <div class="flex flex-col gap-1">
                              <span class="text-[8px] text-[#4A4A4A] uppercase">Active Branch</span>
                              <span class="text-[10px] text-[#88C0D0]">main</span>
                            </div>
                            <div class="flex flex-col gap-1">
                              <span class="text-[8px] text-[#4A4A4A] uppercase">Indexed File</span>
                              <span class="text-[10px] text-[#E0E0E0]">1.4K</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </Match>
              <Match when={true}>
                <div class="h-64 flex flex-col items-center justify-center border border-dashed border-[#1A1A1A] rounded-sm bg-[#080808]">
                  <Icon name="folder-add-left" class="w-12 h-12 text-[#4A4A4A] mb-4" />
                  <p class="text-xs text-[#4A4A4A] uppercase mb-4">{language.t("home.empty.title")}</p>
                  <Button onClick={chooseProject} class="bg-[#E0E0E0] text-[#050505] text-[10px] font-bold px-6 py-2 uppercase tracking-widest hover:bg-[#A3BE8C]">
                    INITIALIZE_WORKSPACE
                  </Button>
                </div>
              </Match>
            </Switch>
          </section>

          {/* Capabilities Preview */}
          <section class="space-y-4">
            <div class="flex items-center gap-3 mb-6 border-b border-[#1A1A1A] pb-4">
              <span class="w-1 h-5 bg-[#88C0D0]"></span>
              <h2 class="text-sm font-bold uppercase tracking-[0.2em]">AGENTIC_CAPABILITIES</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "SEMANTIC_INDEX", icon: "brain", desc: "Global codebase understanding for precise queries." },
                { title: "MULTI_AGENT", icon: "user-group", desc: "Collaborative agent workflows for complex refactoring." },
                { title: "REMOTE_EXEC", icon: "console", desc: "Offload compute-heavy tasks to specialized LLMs." }
              ].map(cap => (
                <div class="bg-[#0A0A0A] border border-[#1A1A1A] p-4 space-y-3">
                  <Icon name={cap.icon as any} class="w-5 h-5 text-[#88C0D0]" />
                  <h4 class="text-[10px] font-bold uppercase tracking-widest">{cap.title}</h4>
                  <p class="text-[9px] text-[#4A4A4A] leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Global Stats & Log */}
        <div class="xl:col-span-4 space-y-8">
          <section class="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded-sm space-y-6">
            <div class="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <span class="text-[10px] font-bold uppercase tracking-wider">System_Diagnostics</span>
              <span class="text-[9px] text-[#A3BE8C] animate-pulse">SYSTEM_STABLE</span>
            </div>
            <div class="space-y-6">
              {[
                { label: "Neural Engine Load", val: "14%", color: "#A3BE8C" },
                { label: "Memory Saturation", val: "2.8 GB", color: "#88C0D0" },
                { label: "Context Buffer", val: "882 MB", color: "#EBCB8B" }
              ].map(stat => (
                <div class="space-y-2">
                  <div class="flex justify-between text-[8px] uppercase text-[#4A4A4A] tracking-tighter">
                    <span>{stat.label}</span>
                    <span>{stat.val}</span>
                  </div>
                  <div class="h-1 bg-[#111] rounded-full overflow-hidden">
                    <div class="h-full" style={{ width: stat.val.includes("%") ? stat.val : "40%", "background-color": stat.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section class="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded-sm flex-1">
            <div class="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-4">
              <span class="text-[10px] font-bold uppercase tracking-wider">Global_Activity_Stream</span>
            </div>
            <div class="space-y-4 text-[9px] font-mono">
              <div class="flex gap-2">
                <span class="text-[#4A4A4A]">[17:22:04]</span>
                <span class="text-[#A3BE8C] underline">LOGIN</span>
                <span class="text-[#E0E0E0]">User authenticated via secure_tunnel.</span>
              </div>
              <div class="flex gap-2">
                <span class="text-[#4A4A4A]">[17:28:11]</span>
                <span class="text-[#88C0D0] underline">SYNC</span>
                <span class="text-[#E0E0E0]">Workspace context refreshed for packages/app.</span>
              </div>
              <div class="flex gap-2">
                <span class="text-[#4A4A4A]">[17:42:50]</span>
                <span class="text-[#EBCB8B] underline">WARN</span>
                <span class="text-[#E0E0E0]">LSP indexer reported 12 non-critical errors.</span>
              </div>
              <div class="flex gap-2">
                <span class="text-[#4A4A4A]">[17:49:10]</span>
                <span class="text-[#A3BE8C] underline">READY</span>
                <span class="text-[#E0E0E0]">Mission Control initialized successfully.</span>
              </div>
              <div class="flex gap-2 animate-pulse mt-4">
                <span class="text-[#4A4A4A]">_</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Interface */}
      <footer class="h-12 border-t border-[#1A1A1A] bg-[#0A0A0A] px-8 flex items-center justify-between text-[10px] text-[#4A4A4A] uppercase tracking-[0.3em]">
        <div class="flex gap-12">
          <span>Mode: Standby</span>
          <span>Security: High-Assurance</span>
        </div>
        <div class="flex gap-8">
          <span class="text-[#E0E0E0]">Neocode v1.0.4-agentic-rc1</span>
        </div>
      </footer>
    </div>
  )
}
