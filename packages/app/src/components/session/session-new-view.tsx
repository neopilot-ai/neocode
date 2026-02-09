import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js"
import { useParams } from "@solidjs/router"
import { DateTime } from "luxon"
import { useSync } from "@/context/sync"
import { useLanguage } from "@/context/language"
import { useLocal } from "@/context/local"
import { Icon } from "@neocode-ai/ui/icon"
import { getDirectory, getFilename } from "@neocode-ai/util/path"

const MAIN_WORKTREE = "main"
const CREATE_WORKTREE = "create"

interface NewSessionViewProps {
  worktree: string
  onWorktreeChange: (value: string) => void
}

export function NewSessionView(props: NewSessionViewProps) {
  const params = useParams()
  const sync = useSync()
  const language = useLanguage()
  const local = useLocal()
  const [time, setTime] = createSignal(DateTime.now().toFormat("HH:mm:ss"))

  onMount(() => {
    const interval = setInterval(() => {
      setTime(DateTime.now().toFormat("HH:mm:ss"))
    }, 1000)
    onCleanup(() => clearInterval(interval))
  })


  const sandboxes = createMemo(() => sync.project?.sandboxes ?? [])
  const options = createMemo(() => [MAIN_WORKTREE, ...sandboxes(), CREATE_WORKTREE])
  const current = createMemo(() => {
    const selection = props.worktree
    if (options().includes(selection)) return selection
    return MAIN_WORKTREE
  })
  const projectRoot = createMemo(() => sync.project?.worktree ?? sync.data.path.directory)
  const isWorktree = createMemo(() => {
    const project = sync.project
    if (!project) return false
    return sync.data.path.directory !== project.worktree
  })

  const label = (value: string) => {
    if (value === MAIN_WORKTREE) {
      if (isWorktree()) return language.t("session.new.worktree.main")
      const branch = sync.data.vcs?.branch
      if (branch) return language.t("session.new.worktree.mainWithBranch", { branch })
      return language.t("session.new.worktree.main")
    }

    if (value === CREATE_WORKTREE) return language.t("session.new.worktree.create")

    return getFilename(value)
  }

  const model = createMemo(() => local.model.current())
  const agent = createMemo(() => local.agent.current())

  return (
    <div class="size-full bg-[#050505] text-[#E0E0E0] font-mono flex flex-col overflow-hidden selection:bg-[#A3BE8C] selection:text-[#050505]">
      {/* Header */}
      <header class="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <div class="flex items-center gap-6">
          <span class="font-bold tracking-tighter text-xs text-[#88C0D0]">NEOCODE_v1.1.1</span>
          <div class="hidden md:flex items-center gap-8 text-[10px] text-[#4A4A4A] font-bold">
            <span class="flex items-center gap-2"><div class="size-1 bg-[#A3BE8C]" /> LSP: READY</span>
            <span class="flex items-center gap-2"><div class="size-1 bg-[#88C0D0]" /> CTX: {getFilename(projectRoot()).toUpperCase()}</span>
            <span class="flex items-center gap-2"><div class="size-1 bg-[#B48EAD]" /> MDL: {model()?.name ?? "NONE"}</span>
          </div>
        </div>
        <div class="flex items-center gap-6 text-[10px] font-bold">
          <span class="text-[#A3BE8C] flex items-center gap-2">
            <div class="size-1.5 bg-[#A3BE8C] animate-pulse" />
            SECURE_TUNNEL
          </span>
          <span class="text-[#4A4A4A] bg-[#111] px-2 py-0.5 border border-[#1A1A1A]">{time()}</span>
        </div>
      </header>

      {/* Main Content */}
      <main class="flex-1 overflow-y-auto custom-scrollbar relative px-6 py-12 lg:px-[15%] pb-[calc(var(--prompt-height,11.25rem)+64px)]">
        <div class="mb-12">
          <div class="flex items-center gap-3 text-[#4A4A4A] text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
            <Icon name="console" class="!w-3.5 !h-3.5" />
            <span>00 // SESSION_INITIALIZATION</span>
          </div>
          <h1 class="text-xl md:text-2xl font-bold leading-relaxed tracking-tight">
            <span class="text-[#A3BE8C]">$</span> explore <span class="text-[#88C0D0]">{getFilename(projectRoot())}</span>{" "}
            <span class="text-[#4A4A4A] italic">--deep-context</span>
          </h1>
        </div>

        <div class="border-t border-dashed border-[#1A1A1A] my-8 relative">
          <span class="absolute -top-[7px] left-8 bg-[#050505] px-3 text-[9px] text-[#2A2A2A] font-bold uppercase tracking-widest">System_Context_Stream</span>
        </div>

        <article class="space-y-12 pb-32">
          <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div class="xl:col-span-3 space-y-12">
              <div class="flex flex-wrap gap-8 text-[9px] font-bold uppercase tracking-[0.15em] text-[#4A4A4A] border-b border-[#1A1A1A] pb-6">
                <div class="flex items-center gap-2">
                  <span class="opacity-30">PROVIDER:</span> <span class="text-[#E0E0E0]">{model()?.provider.name ?? "Agnostic"}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="opacity-30">AGENT:</span> <span class="text-[#E0E0E0]">{agent()?.name ?? "Standard"}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="opacity-30">STATUS:</span> <span class="text-[#A3BE8C]">ACTIVE</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="opacity-30">BRANCH:</span> <span class="text-[#88C0D0]">{label(current())}</span>
                </div>
              </div>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="px-1.5 py-0.5 bg-[#B48EAD] text-[#050505] text-[10px] font-bold">01</div>
                  <h2 class="text-xs font-bold uppercase tracking-wider text-[#B48EAD]">Project Foundation</h2>
                </div>
                <p class="text-[13px] leading-relaxed text-[#E0E0E0]/80">
                  Deeply integrated with <span class="text-[#88C0D0] font-bold underline decoration-[#88C0D0]/30 underline-offset-4">{getFilename(projectRoot())}</span>. This session
                  leverages localized context to provide precise, agentic assistance. Optimized for terminal-focused
                  workflows and high-fidelity code generation.
                </p>
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="px-1.5 py-0.5 bg-[#88C0D0] text-[#050505] text-[10px] font-bold">02</div>
                  <h2 class="text-xs font-bold uppercase tracking-wider text-[#88C0D0]">Core Capabilities</h2>
                </div>
                <div class="relative group">
                  <div class="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded-none">
                    <div class="flex justify-between text-[9px] mb-6 text-[#2A2A2A] font-bold border-b border-[#1A1A1A] pb-3 uppercase tracking-widest">
                      <span>ROOT: {getDirectory(projectRoot())}</span>
                      <span>MDL_ID: {model()?.id ?? "UNDEFINED"}</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 pt-2">
                      <div class="space-y-4">
                        <div class="text-[10px] text-[#4A4A4A] font-bold uppercase tracking-wider flex items-center gap-2">
                          <div class="size-1.5 bg-[#A3BE8C]" />
                          Capabilities
                        </div>
                        <ul class="text-[11px] space-y-3 text-[#E0E0E0]/70">
                          <li class="flex gap-3">
                            <span class="text-[#A3BE8C] font-bold">[_]</span>
                            <span><span class="text-[#E0E0E0] font-bold">Semantic Search:</span> AI-driven codebase exploration and indexing.</span>
                          </li>
                          <li class="flex gap-3">
                            <span class="text-[#88C0D0] font-bold">[_]</span>
                            <span><span class="text-[#E0E0E0] font-bold">LSP Insight:</span> Real-time editor-level type and symbol awareness.</span>
                          </li>
                          <li class="flex gap-3">
                            <span class="text-[#B48EAD] font-bold">[_]</span>
                            <span><span class="text-[#E0E0E0] font-bold">Multi-Agent:</span> Parallelized agents for architectural planning.</span>
                          </li>
                        </ul>
                      </div>
                      <div class="space-y-4">
                        <div class="text-[10px] text-[#4A4A4A] font-bold uppercase tracking-wider flex items-center gap-2">
                          <div class="size-1.5 bg-[#BF616A]" />
                          Security_Protocol
                        </div>
                        <p class="text-[11px] text-[#E0E0E0]/70 leading-relaxed border-l border-[#1A1A1A] pl-4">
                          AES-256 encrypted local storage, provider-agnostic zero-retention privacy, and transparent sandboxed execution. Built for
                          security-first engineering teams.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div class="space-y-8">
              <section class="bg-[#0A0A0A] border border-[#1A1A1A] p-5 rounded-none space-y-5">
                <div class="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-2">
                  <span class="text-[10px] font-bold text-[#4A4A4A] uppercase tracking-[0.2em]">Health_Monitor</span>
                  <span class="text-[9px] text-[#A3BE8C] font-bold animate-pulse">STABLE</span>
                </div>
                {[
                  { label: "CPU_LOAD", width: "42%", color: "#A3BE8C" },
                  { label: "MEM_USAGE", width: "18%", color: "#88C0D0" },
                  { label: "OPS_PER_SEC", width: "88%", color: "#EBCB8B" },
                ].map((item) => (
                  <div class="space-y-2">
                    <div class="flex justify-between text-[9px] font-bold uppercase text-[#2A2A2A]">
                      <span>{item.label}</span>
                      <span>{item.width}</span>
                    </div>
                    <div class="w-full bg-[#050505] border border-[#1A1A1A] h-2 rounded-none overflow-hidden">
                      <div
                        class="h-full transition-all duration-1000 ease-out"
                        style={{ width: item.width, "background-color": item.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </section>

              <section class="bg-[#0A0A0A] border border-[#1A1A1A] p-5 rounded-none space-y-5">
                <div class="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-2">
                  <span class="text-[10px] font-bold text-[#4A4A4A] uppercase tracking-[0.2em]">Activity_Log</span>
                </div>
                <div class="space-y-4 font-mono text-[9px] text-[#4A4A4A] font-bold">
                  <div class="flex gap-3">
                    <span class="text-[#A3BE8C]">[OK]</span>
                    <span class="truncate">BOOT session_{params.id?.substring(0, 4) ?? "root"}</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-[#88C0D0]">[LD]</span>
                    <span class="truncate">INDEX {getFilename(projectRoot())} context</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-[#B48EAD]">[AI]</span>
                    <span class="truncate">MOUNT {agent()?.name ?? "standard"}-agent</span>
                  </div>
                  <div class="flex gap-3 opacity-30 italic">
                    <span class="text-[#4A4A4A]">[..]</span>
                    <span class="truncate">AWAITING_COMMAND</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <Show when={sync.project}>
            {(project) => (
              <div class="flex items-center gap-4 pt-4 text-[10px] text-[#4A4A4A] uppercase tracking-tighter">
                <div class="flex items-center gap-2">
                  <Icon name="pencil-line" class="!w-3 !h-3" />
                  <span>Modified: {DateTime.fromMillis(project().time.updated ?? project().time.created).toRelative()}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Icon name="folder" class="!w-3 !h-3" />
                  <span>Path: {project().worktree.replace(sync.data.path.home, "~")}</span>
                </div>
              </div>
            )}
          </Show>
        </article>
      </main>
    </div>
  )
}
