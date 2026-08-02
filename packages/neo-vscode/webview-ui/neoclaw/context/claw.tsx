// NeoClaw state context
//
// All data arrives from the extension host via postMessage.
// The webview has no direct network access — it dispatches commands via
// vscode.postMessage() and receives state diffs back.

import { createContext, createMemo, createSignal, onMount, onCleanup, useContext, type JSX } from "solid-js"
import { showToast } from "@neocode/neo-ui/toast"
import { applyFontSize } from "../../src/font-size"
import type {
  BotStatusRecord,
  ClawStatus,
  ContentBlock,
  ConversationListItem,
  ConversationStatusRecord,
  ExecApprovalDecision,
  NeoClawOutMessage,
  NeoClawState,
  Message,
  TypingMember,
} from "../lib/types"

type VSCodeAPI = {
  postMessage(msg: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

declare function acquireVsCodeApi(): VSCodeAPI

const vscode = acquireVsCodeApi()

type Phase = "loading" | "noInstance" | "needsUpgrade" | "error" | "ready"

export type ClawCtx = {
  // Lifecycle
  phase: () => Phase
  locale: () => string | undefined
  error: () => string | null
  retry: () => void

  // Identity / instance
  status: () => ClawStatus | null
  currentUserId: () => string
  sandboxId: () => string
  assistantName: () => string | null

  // Conversations
  conversations: () => ConversationListItem[]
  hasMoreConversations: () => boolean
  activeConversationId: () => string | null
  selectConversation: (conversationId: string) => void
  createConversation: (title?: string) => void
  renameConversation: (conversationId: string, title: string) => void
  leaveConversation: (conversationId: string) => void
  loadMoreConversations: () => void

  // Messages
  messages: () => Message[]
  hasMoreMessages: () => boolean
  sendMessage: (conversationId: string, content: ContentBlock[], inReplyToMessageId?: string) => void
  editMessage: (conversationId: string, messageId: string, content: ContentBlock[]) => void
  deleteMessage: (conversationId: string, messageId: string) => void
  loadMoreMessages: (conversationId: string, before: string) => void

  // Reactions
  addReaction: (conversationId: string, messageId: string, emoji: string) => void
  removeReaction: (conversationId: string, messageId: string, emoji: string) => void

  // Approvals
  executeAction: (conversationId: string, messageId: string, groupId: string, value: ExecApprovalDecision) => void

  // Typing
  sendTyping: (conversationId: string) => void
  sendTypingStop: (conversationId: string) => void
  typingMembers: (conversationId: string) => TypingMember[]

  // Status
  botStatus: () => BotStatusRecord | null
  conversationStatus: () => ConversationStatusRecord | null
  markConversationRead: (conversationId: string) => void

  // External links
  openExternal: (url: string) => void
}

const ClawContext = createContext<ClawCtx>()

export function ClawProvider(props: { children: JSX.Element }) {
  const [phase, setPhase] = createSignal<Phase>("loading")
  const [locale, setLocale] = createSignal<string | undefined>(undefined)
  const [status, setStatus] = createSignal<ClawStatus | null>(null)
  const [currentUserId, setCurrentUserId] = createSignal<string>("")
  const [sandboxId, setSandboxId] = createSignal<string>("")
  // `assistantName` is derived from `status.botName` so it tracks updates
  // from both the initial state snapshot and subsequent status polls
  // (the gateway's onboarding mutation can set/change the bot name at
  // any time).
  const assistantName = createMemo<string | null>(() => status()?.botName ?? null)
  const [conversations, setConversations] = createSignal<ConversationListItem[]>([])
  const [hasMoreConversations, setHasMoreConversations] = createSignal(false)
  const [activeConversationId, setActiveConversationId] = createSignal<string | null>(null)
  const [messages, setMessages] = createSignal<Message[]>([])
  const [hasMoreMessages, setHasMoreMessages] = createSignal(false)
  const [botStatus, setBotStatus] = createSignal<BotStatusRecord | null>(null)
  const [conversationStatus, setConversationStatus] = createSignal<ConversationStatusRecord | null>(null)
  const [typingMembers, setTypingMembers] = createSignal<TypingMember[]>([])
  const [error, setError] = createSignal<string | null>(null)

  const applyState = (s: NeoClawState) => {
    setPhase(s.phase)
    setLocale(s.locale)
    if (s.phase === "ready") {
      setStatus(s.status)
      setCurrentUserId(s.currentUserId)
      setSandboxId(s.sandboxId)
      setConversations(s.conversations)
      setHasMoreConversations(s.hasMoreConversations)
      setActiveConversationId(s.activeConversationId)
      setMessages(s.messages)
      setHasMoreMessages(s.hasMoreMessages)
      setBotStatus(s.botStatus)
      setConversationStatus(s.conversationStatus)
      setTypingMembers(s.typingMembers)
      setError(null)
    } else if (s.phase === "error") {
      setError(s.error)
    }
  }

  const upsertTyping = (memberId: string) => {
    setTypingMembers((prev) => {
      const idx = prev.findIndex((m) => m.memberId === memberId)
      const now = Date.now()
      if (idx === -1) return [...prev, { memberId, at: now }]
      return prev.map((m, i) => (i === idx ? { ...m, at: now } : m))
    })
  }

  const handleConversationMessage = (msg: NeoClawOutMessage, active: string | null): boolean => {
    switch (msg.type) {
      case "neoclaw.messages":
        if (msg.conversationId === active) {
          setMessages(msg.messages)
          setHasMoreMessages(msg.hasMore)
        }
        return true
      case "neoclaw.messageOptimistic":
        if (msg.conversationId === active) {
          setMessages((prev) => (prev.some((m) => m.id === msg.message.id) ? prev : [...prev, msg.message]))
        }
        return true
      case "neoclaw.messageReplaced":
        if (msg.conversationId === active) {
          // Replace the whole optimistic entry with the server's canonical
          // message so content, timestamps, and reactions stay in sync.
          setMessages((prev) => prev.map((m) => (m.id === msg.pendingId ? msg.message : m)))
        }
        return true
      case "neoclaw.messageRemoved":
        if (msg.conversationId === active) {
          setMessages((prev) => prev.filter((m) => m.id !== msg.messageId))
        }
        return true
      case "neoclaw.typing":
        if (msg.conversationId === active) upsertTyping(msg.memberId)
        return true
      case "neoclaw.typingStop":
        if (msg.conversationId === active) {
          setTypingMembers((prev) => prev.filter((m) => m.memberId !== msg.memberId))
        }
        return true
      default:
        return false
    }
  }

  const handler = (event: MessageEvent) => {
    const msg = event.data as NeoClawOutMessage
    if (msg?.type === "fontSizeChanged") {
      applyFontSize(msg.fontSize)
      return
    }
    if (!msg?.type?.startsWith("neoclaw.")) return
    const active = activeConversationId()
    if (handleConversationMessage(msg, active)) return

    switch (msg.type) {
      case "neoclaw.state":
        applyState(msg.state)
        return
      case "neoclaw.status":
        setStatus(msg.data)
        return
      case "neoclaw.locale":
        setLocale(msg.locale)
        return
      case "neoclaw.error":
        showToast({ title: msg.error, variant: "error", duration: 5000 })
        return
      case "neoclaw.conversations":
        setConversations(msg.conversations)
        setHasMoreConversations(msg.hasMore)
        return
      case "neoclaw.activeConversation":
        setActiveConversationId(msg.conversationId)
        setTypingMembers([])
        return
      case "neoclaw.botStatus":
        setBotStatus(msg.status)
        return
      case "neoclaw.conversationStatus":
        setConversationStatus(msg.status)
        return
    }
  }

  // Register listener immediately (before mount) to catch early pushes
  window.addEventListener("message", handler)
  onCleanup(() => window.removeEventListener("message", handler))

  onMount(() => {
    vscode.postMessage({ type: "neoclaw.ready" })
  })

  const ctx: ClawCtx = {
    phase,
    locale,
    error,
    retry: () => vscode.postMessage({ type: "neoclaw.ready" }),

    status,
    currentUserId,
    sandboxId,
    assistantName,

    conversations,
    hasMoreConversations,
    activeConversationId,
    selectConversation: (conversationId) => vscode.postMessage({ type: "neoclaw.selectConversation", conversationId }),
    createConversation: (title) => vscode.postMessage({ type: "neoclaw.createConversation", title }),
    renameConversation: (conversationId, title) =>
      vscode.postMessage({ type: "neoclaw.renameConversation", conversationId, title }),
    leaveConversation: (conversationId) => vscode.postMessage({ type: "neoclaw.leaveConversation", conversationId }),
    loadMoreConversations: () => vscode.postMessage({ type: "neoclaw.loadMoreConversations" }),

    messages,
    hasMoreMessages,
    sendMessage: (conversationId, content, inReplyToMessageId) =>
      vscode.postMessage({
        type: "neoclaw.sendMessage",
        conversationId,
        content,
        inReplyToMessageId,
      }),
    editMessage: (conversationId, messageId, content) =>
      vscode.postMessage({ type: "neoclaw.editMessage", conversationId, messageId, content }),
    deleteMessage: (conversationId, messageId) =>
      vscode.postMessage({ type: "neoclaw.deleteMessage", conversationId, messageId }),
    loadMoreMessages: (conversationId, before) =>
      vscode.postMessage({ type: "neoclaw.loadMoreMessages", conversationId, before }),

    addReaction: (conversationId, messageId, emoji) =>
      vscode.postMessage({ type: "neoclaw.addReaction", conversationId, messageId, emoji }),
    removeReaction: (conversationId, messageId, emoji) =>
      vscode.postMessage({ type: "neoclaw.removeReaction", conversationId, messageId, emoji }),

    executeAction: (conversationId, messageId, groupId, value) =>
      vscode.postMessage({ type: "neoclaw.executeAction", conversationId, messageId, groupId, value }),

    sendTyping: (conversationId) => vscode.postMessage({ type: "neoclaw.sendTyping", conversationId }),
    sendTypingStop: (conversationId) => vscode.postMessage({ type: "neoclaw.sendTypingStop", conversationId }),
    typingMembers: (conversationId) => {
      // Typing members are tracked for the active conversation only.
      if (conversationId !== activeConversationId()) return []
      return typingMembers()
    },

    botStatus,
    conversationStatus,
    markConversationRead: (conversationId) => vscode.postMessage({ type: "neoclaw.markRead", conversationId }),

    openExternal: (url) => vscode.postMessage({ type: "neoclaw.openExternal", url }),
  }

  return <ClawContext.Provider value={ctx}>{props.children}</ClawContext.Provider>
}

export function useClaw(): ClawCtx {
  const ctx = useContext(ClawContext)
  if (!ctx) throw new Error("useClaw must be used within ClawProvider")
  return ctx
}
