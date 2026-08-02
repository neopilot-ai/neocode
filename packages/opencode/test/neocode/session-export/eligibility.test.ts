import { describe, test, expect, beforeEach } from "bun:test"
import { isEligible, setKillSwitch, resetEligibility, type OrgState } from "@/neocode/session-export/eligibility"

const base = {
  model: {
    api: { npm: "@neocode/neo-gateway" },
    isFree: true,
  },
  org: { type: "personal" } as OrgState,
}

describe("isEligible", () => {
  beforeEach(() => resetEligibility())

  test("free Neo Gateway personal context is eligible", () => {
    expect(isEligible(base)).toBe(true)
  })

  test("paid Neo Gateway is ineligible", () => {
    expect(isEligible({ ...base, model: { ...base.model, isFree: false } })).toBe(false)
  })

  test("isFree=undefined is ineligible", () => {
    expect(isEligible({ ...base, model: { ...base.model, isFree: undefined } })).toBe(false)
  })

  test("non-Neo provider with isFree=true is ineligible", () => {
    expect(isEligible({ ...base, model: { ...base.model, api: { npm: "@ai-sdk/openai" } } })).toBe(false)
  })

  test("org context is ineligible regardless of model", () => {
    expect(isEligible({ ...base, org: { type: "org", id: "org_xyz" } })).toBe(false)
  })

  test("unknown org state is ineligible", () => {
    expect(isEligible({ ...base, org: { type: "unknown" } })).toBe(false)
  })

  test("killSwitch blocks everything", () => {
    setKillSwitch(true, "test")
    expect(isEligible(base)).toBe(false)
  })
})
