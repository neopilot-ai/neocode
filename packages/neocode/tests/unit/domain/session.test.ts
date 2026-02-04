/**
 * Unit tests for Session domain
 */

import { describe, it, expect } from "vitest"
import { Session, SessionFactory, SessionRules } from "@neocode-ai/domain/session"
import type { SessionId, ProjectPath } from "@neocode-ai/shared/types"
import { sessionId, projectPath } from "@neocode-ai/shared/types"
import { InvalidSessionStateError, SessionError } from "@neocode-ai/domain/session"

describe("Session Domain", () => {
  describe("SessionFactory.create", () => {
    it("should create new session with idle status", () => {
      const id = sessionId("sess_123") as SessionId
      const projPath = projectPath("/project") as ProjectPath

      const session = new Session(SessionFactory.create(id, projPath))
      const state = session.getState()

      expect(state.id).toBe(id)
      expect(state.projectPath).toBe(projPath)
      expect(state.status.type).toBe("idle")
      expect(state.messages).toEqual([])
      expect(state.createdAt).toBeLessThanOrEqual(Date.now())
    })

    it("should mark child session appropriately", () => {
      const id = sessionId("sess_123") as SessionId
      const projPath = projectPath("/project") as ProjectPath
      const parentId = sessionId("sess_parent") as SessionId

      const session = new Session(SessionFactory.create(id, projPath, parentId))
      const state = session.getState()

      expect(state.parentSessionId).toBe(parentId)
      expect(state.title).toMatch(/^Child session - /)
    })
  })

  describe("SessionRules.canAcceptMessages", () => {
    it("should allow messages when idle", () => {
      const isAllowed = SessionRules.canAcceptMessages({ type: "idle" })
      expect(isAllowed).toBe(true)
    })

    it("should deny messages when busy", () => {
      const isAllowed = SessionRules.canAcceptMessages({ type: "busy" })
      expect(isAllowed).toBe(false)
    })

    it("should deny messages when completed", () => {
      const isAllowed = SessionRules.canAcceptMessages({ type: "completed" })
      expect(isAllowed).toBe(false)
    })
  })

  describe("Session.addMessage", () => {
    it("should add valid message", () => {
      const id = sessionId("sess_123") as SessionId
      const session = new Session(SessionFactory.create(id, projectPath("/project") as ProjectPath))

      const message = {
        id: "msg_1",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "Hello" }],
        timestamp: Date.now(),
      }

      session.addMessage(message)
      const state = session.getState()

      expect(state.messages).toHaveLength(1)
      expect(state.messages[0]).toBe(message)
    })

    it("should throw when adding message to busy session", () => {
      const id = sessionId("sess_123") as SessionId
      const sessionState = SessionFactory.create(id, projectPath("/project") as ProjectPath)
      sessionState.status = { type: "busy" }

      const session = new Session(sessionState)

      const message = {
        id: "msg_1",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "Hello" }],
        timestamp: Date.now(),
      }

      expect(() => session.addMessage(message)).toThrow(InvalidSessionStateError)
    })

    it("should reject invalid message", () => {
      const id = sessionId("sess_123") as SessionId
      const session = new Session(SessionFactory.create(id, projectPath("/project") as ProjectPath))

      const invalidMessage = {
        id: "",
        role: "user" as const,
        parts: [],
        timestamp: Date.now(),
      }

      expect(() => session.addMessage(invalidMessage)).toThrow(SessionError)
    })
  })

  describe("Session.markBusy", () => {
    it("should transition to busy", () => {
      const id = sessionId("sess_123") as SessionId
      const session = new Session(SessionFactory.create(id, projectPath("/project") as ProjectPath))

      session.markBusy()
      const state = session.getState()

      expect(state.status.type).toBe("busy")
      expect(state.updatedAt).toBeGreaterThanOrEqual(Date.now() - 100)
    })
  })

  describe("Session.markCompleted", () => {
    it("should transition to completed", () => {
      const id = sessionId("sess_123") as SessionId
      const session = new Session(SessionFactory.create(id, projectPath("/project") as ProjectPath))

      session.markCompleted()
      const state = session.getState()

      expect(state.status.type).toBe("completed")
    })
  })

  describe("Session.canAcceptMessages", () => {
    it("should return true when idle", () => {
      const id = sessionId("sess_123") as SessionId
      const session = new Session(SessionFactory.create(id, projectPath("/project") as ProjectPath))

      expect(session.canAcceptMessages()).toBe(true)
    })

    it("should return false when not idle", () => {
      const id = sessionId("sess_123") as SessionId
      const sessionState = SessionFactory.create(id, projectPath("/project") as ProjectPath)
      sessionState.status = { type: "busy" }

      const session = new Session(sessionState)

      expect(session.canAcceptMessages()).toBe(false)
    })
  })

  describe("SessionRules.isDefaultTitle", () => {
    it("should recognize default titles", () => {
      const title1 = "New session - 2025-02-04T10:30:00.000Z"
      const title2 = "Child session - 2025-02-04T10:30:00.000Z"

      expect(SessionRules.isDefaultTitle(title1)).toBe(true)
      expect(SessionRules.isDefaultTitle(title2)).toBe(true)
    })

    it("should reject custom titles", () => {
      const custom = "My Custom Session"

      expect(SessionRules.isDefaultTitle(custom)).toBe(false)
    })
  })
})
