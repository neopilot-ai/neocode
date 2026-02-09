import {
  AssistantMessage,
  FilePart,
  Message as MessageType,
  Part as PartType,
  type PermissionRequest,
  type QuestionRequest,
  TextPart,
  ToolPart,
} from "@neocode-ai/sdk/v2/client"
import { type FileDiff } from "@neocode-ai/sdk/v2"
import { useData } from "../context"
import { useDiffComponent } from "../context/diff"
import { type UiI18nKey, type UiI18nParams, useI18n } from "../context/i18n"
import { findLast } from "@neocode-ai/util/array"
import { getDirectory, getFilename } from "@neocode-ai/util/path"

import { Binary } from "@neocode-ai/util/binary"
import { createEffect, createMemo, createSignal, For, Match, on, onCleanup, ParentProps, Show, Switch } from "solid-js"
import { DiffChanges } from "./diff-changes"
import { Message, Part } from "./message-part"
import { Markdown } from "./markdown"
import { Accordion } from "./accordion"
import { StickyAccordionHeader } from "./sticky-accordion-header"
import { FileIcon } from "./file-icon"
import { Icon } from "./icon"
import { IconButton } from "./icon-button"
import { Card } from "./card"
import { Dynamic } from "solid-js/web"
import { Button } from "./button"
import { Spinner } from "./spinner"
import { Tooltip } from "./tooltip"
import { createStore } from "solid-js/store"
import { DateTime, DurationUnit, Interval } from "luxon"
import { createAutoScroll } from "../hooks"
import { createResizeObserver } from "@solid-primitives/resize-observer"

type Translator = (key: UiI18nKey, params?: UiI18nParams) => string

function computeStatusFromPart(part: PartType | undefined, t: Translator): string | undefined {
  if (!part) return undefined

  if (part.type === "tool") {
    switch (part.tool) {
      case "task":
        return t("ui.sessionTurn.status.delegating")
      case "todowrite":
      case "todoread":
        return t("ui.sessionTurn.status.planning")
      case "read":
        return t("ui.sessionTurn.status.gatheringContext")
      case "list":
      case "grep":
      case "glob":
        return t("ui.sessionTurn.status.searchingCodebase")
      case "webfetch":
        return t("ui.sessionTurn.status.searchingWeb")
      case "edit":
      case "write":
        return t("ui.sessionTurn.status.makingEdits")
      case "bash":
        return t("ui.sessionTurn.status.runningCommands")
      default:
        return undefined
    }
  }
  if (part.type === "reasoning") {
    const text = part.text ?? ""
    const match = text.trimStart().match(/^\*\*(.+?)\*\*/)
    if (match) return t("ui.sessionTurn.status.thinkingWithTopic", { topic: match[1].trim() })
    return t("ui.sessionTurn.status.thinking")
  }
  if (part.type === "text") {
    return t("ui.sessionTurn.status.gatheringThoughts")
  }
  return undefined
}

function same<T>(a: readonly T[], b: readonly T[]) {
  if (a === b) return true
  if (a.length !== b.length) return false
  return a.every((x, i) => x === b[i])
}

function isAttachment(part: PartType | undefined) {
  if (part?.type !== "file") return false
  const mime = (part as FilePart).mime ?? ""
  return mime.startsWith("image/") || mime === "application/pdf"
}

function AssistantMessageItem(props: {
  message: AssistantMessage
  responsePartId: string | undefined
  hideResponsePart: boolean
  hideReasoning: boolean
}) {
  const data = useData()
  const emptyParts: PartType[] = []
  const msgParts = createMemo(() => data.store.part[props.message.id] ?? emptyParts)
  const lastTextPart = createMemo(() => {
    const parts = msgParts()
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i]
      if (part?.type === "text") return part as TextPart
    }
    return undefined
  })

  const filteredParts = createMemo(() => {
    let parts = msgParts()

    if (props.hideReasoning) {
      parts = parts.filter((part) => part?.type !== "reasoning")
    }

    if (!props.hideResponsePart) return parts

    const responsePartId = props.responsePartId
    if (!responsePartId) return parts
    if (responsePartId !== lastTextPart()?.id) return parts

    return parts.filter((part) => part?.id !== responsePartId)
  })

  return <Message message={props.message} parts={filteredParts()} />
}

export function SessionTurn(
  props: ParentProps<{
    sessionID: string
    sessionTitle?: string
    messageID: string
    lastUserMessageID?: string
    stepsExpanded?: boolean
    onStepsExpandedToggle?: () => void
    onUserInteracted?: () => void
    classes?: {
      root?: string
      content?: string
      container?: string
    }
  }>,
) {
  const i18n = useI18n()
  const data = useData()
  const diffComponent = useDiffComponent()

  const emptyMessages: MessageType[] = []
  const emptyParts: PartType[] = []
  const emptyFiles: FilePart[] = []
  const emptyAssistant: AssistantMessage[] = []
  const emptyPermissions: PermissionRequest[] = []
  const emptyPermissionParts: { part: ToolPart; message: AssistantMessage }[] = []
  const emptyQuestions: QuestionRequest[] = []
  const emptyQuestionParts: { part: ToolPart; message: AssistantMessage }[] = []
  const emptyDiffs: FileDiff[] = []
  const idle = { type: "idle" as const }

  const allMessages = createMemo(() => data.store.message[props.sessionID] ?? emptyMessages)

  const messageIndex = createMemo(() => {
    const messages = allMessages() ?? emptyMessages
    const result = Binary.search(messages, props.messageID, (m) => m.id)

    const index = result.found ? result.index : messages.findIndex((m) => m.id === props.messageID)
    if (index < 0) return -1

    const msg = messages[index]
    if (!msg || msg.role !== "user") return -1

    return index
  })

  const message = createMemo(() => {
    const index = messageIndex()
    if (index < 0) return undefined

    const messages = allMessages() ?? emptyMessages
    const msg = messages[index]
    if (!msg || msg.role !== "user") return undefined

    return msg
  })

  const lastUserMessageID = createMemo(() => {
    if (props.lastUserMessageID) return props.lastUserMessageID

    const messages = allMessages() ?? emptyMessages
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg?.role === "user") return msg.id
    }
    return undefined
  })

  const isLastUserMessage = createMemo(() => props.messageID === lastUserMessageID())

  const parts = createMemo(() => {
    const msg = message()
    if (!msg) return emptyParts
    return data.store.part[msg.id] ?? emptyParts
  })

  const attachmentParts = createMemo(() => {
    const msgParts = parts()
    if (msgParts.length === 0) return emptyFiles
    return msgParts.filter((part) => isAttachment(part)) as FilePart[]
  })

  const stickyParts = createMemo(() => {
    const msgParts = parts()
    if (msgParts.length === 0) return emptyParts
    if (attachmentParts().length === 0) return msgParts
    return msgParts.filter((part) => !isAttachment(part))
  })

  const assistantMessages = createMemo(
    () => {
      const msg = message()
      if (!msg) return emptyAssistant

      const messages = allMessages() ?? emptyMessages
      const index = messageIndex()
      if (index < 0) return emptyAssistant

      const result: AssistantMessage[] = []
      for (let i = index + 1; i < messages.length; i++) {
        const item = messages[i]
        if (!item) continue
        if (item.role === "user") break
        if (item.role === "assistant" && item.parentID === msg.id) result.push(item as AssistantMessage)
      }
      return result
    },
    emptyAssistant,
    { equals: same },
  )

  const lastAssistantMessage = createMemo(() => assistantMessages().at(-1))

  const error = createMemo(() => assistantMessages().find((m) => m.error)?.error)

  const lastTextPart = createMemo(() => {
    const msgs = assistantMessages()
    for (let mi = msgs.length - 1; mi >= 0; mi--) {
      const msgParts = data.store.part[msgs[mi].id] ?? emptyParts
      for (let pi = msgParts.length - 1; pi >= 0; pi--) {
        const part = msgParts[pi]
        if (part?.type === "text") return part as TextPart
      }
    }
    return undefined
  })

  const hasSteps = createMemo(() => {
    for (const m of assistantMessages()) {
      const msgParts = data.store.part[m.id]
      if (!msgParts) continue
      for (const p of msgParts) {
        if (p?.type === "tool") return true
      }
    }
    return false
  })

  const permissions = createMemo(() => data.store.permission?.[props.sessionID] ?? emptyPermissions)
  const permissionCount = createMemo(() => permissions().length)
  const nextPermission = createMemo(() => permissions()[0])

  const permissionParts = createMemo(() => {
    if (props.stepsExpanded) return emptyPermissionParts

    const next = nextPermission()
    if (!next || !next.tool) return emptyPermissionParts

    const message = findLast(assistantMessages(), (m) => m.id === next.tool!.messageID)
    if (!message) return emptyPermissionParts

    const parts = data.store.part[message.id] ?? emptyParts
    for (const part of parts) {
      if (part?.type !== "tool") continue
      const tool = part as ToolPart
      if (tool.callID === next.tool?.callID) return [{ part: tool, message }]
    }

    return emptyPermissionParts
  })

  const questions = createMemo(() => data.store.question?.[props.sessionID] ?? emptyQuestions)
  const nextQuestion = createMemo(() => questions()[0])

  const questionParts = createMemo(() => {
    if (props.stepsExpanded) return emptyQuestionParts

    const next = nextQuestion()
    if (!next || !next.tool) return emptyQuestionParts

    const message = findLast(assistantMessages(), (m) => m.id === next.tool!.messageID)
    if (!message) return emptyQuestionParts

    const parts = data.store.part[message.id] ?? emptyParts
    for (const part of parts) {
      if (part?.type !== "tool") continue
      const tool = part as ToolPart
      if (tool.callID === next.tool?.callID) return [{ part: tool, message }]
    }

    return emptyQuestionParts
  })

  const answeredQuestionParts = createMemo(() => {
    if (props.stepsExpanded) return emptyQuestionParts
    if (questions().length > 0) return emptyQuestionParts

    const result: { part: ToolPart; message: AssistantMessage }[] = []

    for (const msg of assistantMessages()) {
      const parts = data.store.part[msg.id] ?? emptyParts
      for (const part of parts) {
        if (part?.type !== "tool") continue
        const tool = part as ToolPart
        if (tool.tool !== "question") continue
        // @ts-expect-error metadata may not exist on all tool states
        const answers = tool.state?.metadata?.answers
        if (answers && answers.length > 0) {
          result.push({ part: tool, message: msg })
        }
      }
    }

    return result
  })

  const shellModePart = createMemo(() => {
    const p = parts()
    if (p.length === 0) return
    if (!p.every((part) => part?.type === "text" && part?.synthetic)) return

    const msgs = assistantMessages()
    if (msgs.length !== 1) return

    const msgParts = data.store.part[msgs[0].id] ?? emptyParts
    if (msgParts.length !== 1) return

    const assistantPart = msgParts[0]
    if (assistantPart?.type === "tool" && assistantPart.tool === "bash") return assistantPart
  })

  const isShellMode = createMemo(() => !!shellModePart())

  const rawStatus = createMemo(() => {
    const msgs = assistantMessages()
    let last: PartType | undefined
    let currentTask: ToolPart | undefined

    for (let mi = msgs.length - 1; mi >= 0; mi--) {
      const msgParts = data.store.part[msgs[mi].id] ?? emptyParts
      for (let pi = msgParts.length - 1; pi >= 0; pi--) {
        const part = msgParts[pi]
        if (!part) continue
        if (!last) last = part

        if (
          part.type === "tool" &&
          part.tool === "task" &&
          part.state &&
          "metadata" in part.state &&
          part.state.metadata?.sessionId &&
          part.state.status === "running"
        ) {
          currentTask = part as ToolPart
          break
        }
      }
      if (currentTask) break
    }

    const taskSessionId =
      currentTask?.state && "metadata" in currentTask.state
        ? (currentTask.state.metadata?.sessionId as string | undefined)
        : undefined

    if (taskSessionId) {
      const taskMessages = data.store.message[taskSessionId] ?? emptyMessages
      for (let mi = taskMessages.length - 1; mi >= 0; mi--) {
        const msg = taskMessages[mi]
        if (!msg || msg.role !== "assistant") continue

        const msgParts = data.store.part[msg.id] ?? emptyParts
        for (let pi = msgParts.length - 1; pi >= 0; pi--) {
          const part = msgParts[pi]
          if (part) return computeStatusFromPart(part, i18n.t)
        }
      }
    }

    return computeStatusFromPart(last, i18n.t)
  })

  const status = createMemo(() => data.store.session_status[props.sessionID] ?? idle)
  const working = createMemo(() => status().type !== "idle" && isLastUserMessage())
  const retry = createMemo(() => {
    // session_status is session-scoped; only show retry on the active (last) turn
    if (!isLastUserMessage()) return
    const s = status()
    if (s.type !== "retry") return
    return s
  })

  const response = createMemo(() => lastTextPart()?.text)
  const responsePartId = createMemo(() => lastTextPart()?.id)
  const messageDiffs = createMemo(() => message()?.summary?.diffs ?? emptyDiffs)
  const hasDiffs = createMemo(() => messageDiffs().length > 0)
  const hideResponsePart = createMemo(() => !working() && !!responsePartId())

  const [copied, setCopied] = createSignal(false)

  const handleCopy = async () => {
    const content = response() ?? ""
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [rootRef, setRootRef] = createSignal<HTMLDivElement | undefined>()
  const [stickyRef, setStickyRef] = createSignal<HTMLDivElement | undefined>()

  const updateStickyHeight = (height: number) => {
    const root = rootRef()
    if (!root) return
    const next = Math.ceil(height)
    root.style.setProperty("--session-turn-sticky-height", `${next}px`)
  }

  function duration() {
    const msg = message()
    if (!msg) return ""
    const completed = lastAssistantMessage()?.time.completed
    const from = DateTime.fromMillis(msg.time.created)
    const to = completed ? DateTime.fromMillis(completed) : DateTime.now()
    const interval = Interval.fromDateTimes(from, to)
    const unit: DurationUnit[] = interval.length("seconds") > 60 ? ["minutes", "seconds"] : ["seconds"]

    const locale = i18n.locale()
    const human = interval.toDuration(unit).normalize().reconfigure({ locale }).toHuman({
      notation: "compact",
      unitDisplay: "narrow",
      compactDisplay: "short",
      showZeros: false,
    })
    return locale.startsWith("zh") ? human.replaceAll("、", "") : human
  }

  const autoScroll = createAutoScroll({
    working,
    onUserInteracted: props.onUserInteracted,
    overflowAnchor: "auto",
  })

  createResizeObserver(
    () => stickyRef(),
    ({ height }) => {
      updateStickyHeight(height)
    },
  )

  createEffect(() => {
    const root = rootRef()
    if (!root) return
    const sticky = stickyRef()
    if (!sticky) {
      root.style.setProperty("--session-turn-sticky-height", "0px")
      return
    }
    updateStickyHeight(sticky.getBoundingClientRect().height)
  })

  const diffInit = 20
  const diffBatch = 20

  const [store, setStore] = createStore({
    retrySeconds: 0,
    diffsOpen: [] as string[],
    diffLimit: diffInit,
    status: rawStatus(),
    duration: duration(),
  })

  createEffect(
    on(
      () => message()?.id,
      () => {
        setStore("diffsOpen", [])
        setStore("diffLimit", diffInit)
      },
      { defer: true },
    ),
  )

  createEffect(() => {
    const r = retry()
    if (!r) {
      setStore("retrySeconds", 0)
      return
    }
    const updateSeconds = () => {
      const next = r.next
      if (next) setStore("retrySeconds", Math.max(0, Math.round((next - Date.now()) / 1000)))
    }
    updateSeconds()
    const timer = setInterval(updateSeconds, 1000)
    onCleanup(() => clearInterval(timer))
  })

  createEffect(() => {
    const update = () => {
      setStore("duration", duration())
    }

    update()

    // Only keep ticking while the active (in-progress) turn is running.
    if (!working()) return

    const timer = setInterval(update, 1000)
    onCleanup(() => clearInterval(timer))
  })

  createEffect(
    on(permissionCount, (count, prev) => {
      if (!count) return
      if (prev !== undefined && count <= prev) return
      autoScroll.forceScrollToBottom()
    }),
  )

  let lastStatusChange = Date.now()
  let statusTimeout: number | undefined
  createEffect(() => {
    const newStatus = rawStatus()
    if (newStatus === store.status || !newStatus) return

    const timeSinceLastChange = Date.now() - lastStatusChange
    if (timeSinceLastChange >= 2500) {
      setStore("status", newStatus)
      lastStatusChange = Date.now()
      if (statusTimeout) {
        clearTimeout(statusTimeout)
        statusTimeout = undefined
      }
    } else {
      if (statusTimeout) clearTimeout(statusTimeout)
      statusTimeout = setTimeout(() => {
        setStore("status", rawStatus())
        lastStatusChange = Date.now()
        statusTimeout = undefined
      }, 2500 - timeSinceLastChange) as unknown as number
    }
  })

  onCleanup(() => {
    if (!statusTimeout) return
    clearTimeout(statusTimeout)
  })

  return (
    <div data-component="session-turn" class={`${props.classes?.root} font-mono`} ref={setRootRef}>
      <div
        ref={autoScroll.scrollRef}
        onScroll={autoScroll.handleScroll}
        data-slot="session-turn-content"
        class={props.classes?.content}
      >
        <div onClick={autoScroll.handleInteraction} class="py-6">
          <Show when={message()}>
            {(msg) => (
              <div
                ref={autoScroll.contentRef}
                data-message={msg().id}
                data-slot="session-turn-message-container"
                class={`${props.classes?.container} max-w-none border-l-2 border-[#1A1A1A] ml-2 md:ml-6 pl-4 md:pl-8`}
              >
                {/* Turn Header */}
                <div class="flex items-center gap-4 mb-6 -ml-[calc(1rem+2px)] md:-ml-[calc(2rem-2px)]">
                  <div class="size-2 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] shadow-[0_0_10px_rgba(163,190,140,0.1)]" />
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold text-[#333] tracking-[0.3em] uppercase">TURN_{msg().id.slice(0, 4)}</span>
                    <span class="w-12 h-[1px] bg-[#111]"></span>
                    <span class="text-[9px] text-[#2A2A2A]">{DateTime.fromMillis(msg().time.created).toFormat("HH:mm:ss")}</span>
                  </div>
                </div>

                <Switch>
                  <Match when={isShellMode()}>
                    <Part part={shellModePart()!} message={msg()} defaultOpen />
                  </Match>
                  <Match when={true}>
                    <Show when={attachmentParts().length > 0}>
                      <div data-slot="session-turn-attachments" aria-live="off" class="mb-4">
                        <Message message={msg()} parts={attachmentParts()} />
                      </div>
                    </Show>
                    <div data-slot="session-turn-sticky" ref={setStickyRef}>
                      {/* User Message */}
                      <div data-slot="session-turn-message-content" aria-live="off" class="text-[#E0E0E0] text-[13px] leading-relaxed mb-6">
                        <Message message={msg()} parts={stickyParts()} />
                      </div>

                      {/* Trigger (status bar) */}
                      <Show when={working() || hasSteps()}>
                        <div data-slot="session-turn-response-trigger" class="my-6">
                          <button
                            data-expandable={assistantMessages().length > 0}
                            class="flex items-center gap-3 px-3 py-1.5 bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm hover:border-[#A3BE8C]/30 transition-all text-[#4A4A4A] group"
                            onClick={props.onStepsExpandedToggle ?? (() => { })}
                            aria-expanded={props.stepsExpanded}
                          >
                            <div class="flex items-center gap-2">
                              <Switch>
                                <Match when={working()}>
                                  <div class="size-2.5 bg-[#A3BE8C] animate-pulse rounded-[1px]" />
                                </Match>
                                <Match when={true}>
                                  <div class={`size-2.5 border border-[#4A4A4A] rounded-[1px] ${props.stepsExpanded ? "bg-[#A3BE8C]/20 border-[#A3BE8C]/50" : ""}`} />
                                </Match>
                              </Switch>

                              <div class="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest">
                                <Switch>
                                  <Match when={retry()}>
                                    <span class="text-[#BF616A]">
                                      {(() => {
                                        const r = retry()
                                        if (!r) return ""
                                        return r.message.length > 50 ? r.message.slice(0, 50) + "..." : r.message
                                      })()}
                                    </span>
                                    <span class="text-[#4A4A4A]">
                                      · {i18n.t("ui.sessionTurn.retry.retrying")}
                                      {store.retrySeconds > 0
                                        ? " " + i18n.t("ui.sessionTurn.retry.inSeconds", { seconds: store.retrySeconds })
                                        : ""}
                                    </span>
                                  </Match>
                                  <Match when={working()}>
                                    <span class="text-[#A3BE8C] text-glow">
                                      {store.status ?? i18n.t("ui.sessionTurn.status.consideringNextSteps")}
                                    </span>
                                  </Match>
                                  <Match when={props.stepsExpanded}>
                                    <span class="text-[#E0E0E0]">{i18n.t("ui.sessionTurn.steps.hide")}</span>
                                  </Match>
                                  <Match when={!props.stepsExpanded}>
                                    <span class="text-[#4A4A4A] group-hover:text-[#E0E0E0]">{i18n.t("ui.sessionTurn.steps.show")}</span>
                                  </Match>
                                </Switch>
                                <span class="text-[#2A2A2A] font-light">·</span>
                                <span class="text-[#2A2A2A] font-light">{store.duration}</span>
                              </div>
                            </div>
                          </button>
                        </div>
                      </Show>
                    </div>
                    {/* Response Steps */}
                    <Show when={props.stepsExpanded && assistantMessages().length > 0}>
                      <div data-slot="session-turn-collapsible-content-inner" aria-hidden={working()} class="space-y-4 mb-8">
                        <For each={assistantMessages()}>
                          {(assistantMessage) => (
                            <div class="border-l border-[#1A1A1A] pl-6 py-2">
                              <AssistantMessageItem
                                message={assistantMessage}
                                responsePartId={responsePartId()}
                                hideResponsePart={hideResponsePart()}
                                hideReasoning={!working()}
                              />
                            </div>
                          )}
                        </For>
                        <Show when={error()}>
                          <div class="p-4 bg-[#BF616A]/10 border border-[#BF616A]/30 text-[#BF616A] text-[11px]">
                            {error()?.data?.message as string}
                          </div>
                        </Show>
                      </div>
                    </Show>
                    <Show when={!props.stepsExpanded && permissionParts().length > 0}>
                      <div data-slot="session-turn-permission-parts">
                        <For each={permissionParts()}>
                          {({ part, message }) => <Part part={part} message={message} />}
                        </For>
                      </div>
                    </Show>
                    <Show when={!props.stepsExpanded && questionParts().length > 0}>
                      <div data-slot="session-turn-question-parts">
                        <For each={questionParts()}>
                          {({ part, message }) => <Part part={part} message={message} />}
                        </For>
                      </div>
                    </Show>
                    <Show when={!props.stepsExpanded && answeredQuestionParts().length > 0}>
                      <div data-slot="session-turn-answered-question-parts">
                        <For each={answeredQuestionParts()}>
                          {({ part, message }) => <Part part={part} message={message} />}
                        </For>
                      </div>
                    </Show>
                    {/* Response */}
                    <div class="sr-only" aria-live="polite">
                      {!working() && response() ? response() : ""}
                    </div>
                    <Show when={!working() && (response() || hasDiffs())}>
                      <div data-slot="session-turn-summary-section" class="mt-8 space-y-8">
                        <Show when={response()}>
                          <div class="space-y-4">
                            <div class="flex items-center gap-2">
                              <span class="text-[9px] font-black text-[#A3BE8C] uppercase tracking-[0.2em] leading-none px-1.5 py-0.5 border border-[#A3BE8C]/30 bg-[#A3BE8C]/5">AGENT_RESPONSE</span>
                              <div class="flex-1 h-[1px] bg-gradient-to-r from-[#1A1A1A] to-transparent"></div>
                            </div>

                            <div class="relative group/response">
                              <Markdown
                                data-slot="session-turn-markdown"
                                class="text-[#E0E0E0] text-[14px] leading-relaxed selection:bg-[#A3BE8C] selection:text-[#050505]"
                                text={response() ?? ""}
                                cacheKey={responsePartId()}
                              />
                              <Show when={response()}>
                                <div class="absolute -right-10 top-0 opacity-0 group-hover/response:opacity-100 transition-opacity">
                                  <Tooltip
                                    value={copied() ? i18n.t("ui.message.copied") : i18n.t("ui.message.copy")}
                                    placement="top"
                                    gutter={8}
                                  >
                                    <IconButton
                                      icon={copied() ? "check" : "copy"}
                                      variant="ghost"
                                      class="size-8 text-[#4A4A4A] hover:text-[#E0E0E0]"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleCopy()
                                      }}
                                    />
                                  </Tooltip>
                                </div>
                              </Show>
                            </div>
                          </div>
                        </Show>

                        <Show when={hasDiffs()}>
                          <div data-slot="session-turn-diff-section" class="space-y-4 pt-6 mt-6 border-t border-[#1A1A1A]">
                            <div class="flex items-center gap-2">
                              <span class="text-[9px] font-black text-[#88C0D0] uppercase tracking-[0.2em] leading-none px-1.5 py-0.5 border border-[#88C0D0]/30 bg-[#88C0D0]/5">FILE_CHANGES</span>
                              <div class="flex-1 h-[1px] bg-gradient-to-r from-[#1A1A1A] to-transparent"></div>
                            </div>
                            <div class="space-y-3">
                              <For each={messageDiffs().slice(0, store.diffLimit)}>
                                {(diff) => (
                                  <div class="space-y-2">
                                    <div
                                      class="flex items-center justify-between p-2 bg-[#0A0A0A] border border-[#1A1A1A] cursor-pointer hover:bg-[#111] transition-colors"
                                      onClick={() => {
                                        const isOpen = store.diffsOpen.includes(diff.file)
                                        if (isOpen) setStore("diffsOpen", (prev) => prev.filter((p) => p !== diff.file))
                                        else setStore("diffsOpen", (prev) => [...prev, diff.file])
                                      }}
                                    >
                                      <div class="flex items-center gap-3">
                                        <span class="text-[10px] text-[#4A4A4A] font-bold">[{store.diffsOpen.includes(diff.file) ? "-" : "+"}]</span>
                                        <span class="text-[11px] text-[#E0E0E0] truncate max-w-[300px]">{diff.file}</span>
                                      </div>
                                      <DiffChanges changes={diff} variant="bars" class="h-3" />
                                    </div>
                                    <Show when={store.diffsOpen.includes(diff.file)}>
                                      <div class="border border-[#1A1A1A] border-t-0 bg-[#050505] p-1 overflow-x-auto custom-scrollbar">
                                        <Dynamic
                                          component={diffComponent}
                                          before={{ name: diff.file, contents: typeof diff.before === "string" ? diff.before : "" }}
                                          after={{ name: diff.file, contents: typeof diff.after === "string" ? diff.after : "" }}
                                        />
                                      </div>
                                    </Show>
                                  </div>
                                )}
                              </For>
                            </div>
                            <Show when={messageDiffs().length > store.diffLimit}>
                              <Button
                                variant="ghost"
                                size="small"
                                class="!text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] hover:text-[#E0E0E0] border border-transparent hover:border-[#1A1A1A]"
                                onClick={() => {
                                  const total = messageDiffs().length
                                  setStore("diffLimit", (limit) => {
                                    const next = limit + diffBatch
                                    if (next > total) return total
                                    return next
                                  })
                                }}
                              >
                                {i18n.t("ui.sessionTurn.diff.showMore", {
                                  count: messageDiffs().length - store.diffLimit,
                                })}
                              </Button>
                            </Show>
                          </div>
                        </Show>
                      </div>
                    </Show>
                    <Show when={error() && !props.stepsExpanded}>
                      <div class="mt-6 p-4 bg-[#BF616A]/10 border border-[#BF616A]/30 text-[#BF616A] text-[11px] font-bold">
                        [ERROR] {error()?.data?.message as string}
                      </div>
                    </Show>
                  </Match>
                </Switch>
              </div>
            )}
          </Show>
          {props.children}
        </div>
      </div>
    </div>
  )
}
