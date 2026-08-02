import { describe, expect, test } from "bun:test"
import { hasGateway, visible } from "./privacy"

describe("model privacy filter", () => {
  test("detects when Neo Gateway models are present", () => {
    expect(hasGateway([{ id: "neo" }, { id: "openai" }])).toBe(true)
    expect(hasGateway([{ id: "openai" }])).toBe(false)
  })

  test("shows every model when disabled", () => {
    expect(visible({ id: "neo" }, { mayTrainOnYourPrompts: true }, false)).toBe(true)
  })

  test("hides only Neo Gateway models explicitly marked for prompt training", () => {
    expect(visible({ id: "neo" }, { mayTrainOnYourPrompts: true }, true)).toBe(false)
    expect(visible({ id: "neo" }, { mayTrainOnYourPrompts: false }, true)).toBe(true)
    expect(visible({ id: "neo" }, {}, true)).toBe(true)
    expect(visible({ id: "openai" }, { mayTrainOnYourPrompts: true }, true)).toBe(true)
  })
})
