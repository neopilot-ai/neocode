import { describe, expect, it } from "bun:test"
import {
  canUseSpeechToText,
  selectedSpeechToTextModel,
} from "../../webview-ui/src/components/speech-to-text/availability"
import { DEFAULT_SPEECH_TO_TEXT_MODEL } from "../../src/speech-to-text/models"

describe("speech-to-text availability", () => {
  it("shows speech input for stored Neo credentials", () => {
    expect(canUseSpeechToText({}, { neo: "oauth" })).toBe(true)
    expect(canUseSpeechToText({}, { neo: "api" })).toBe(true)
  })

  it("hides speech input without usable Neo credentials", () => {
    expect(canUseSpeechToText({}, {})).toBe(false)
    expect(canUseSpeechToText({}, { neo: "wellknown" })).toBe(false)
  })

  it("honors enabled and disabled provider configuration", () => {
    expect(canUseSpeechToText({ disabled_providers: ["neo"] }, { neo: "oauth" })).toBe(false)
    expect(canUseSpeechToText({ enabled_providers: ["openai"] }, { neo: "oauth" })).toBe(false)
    expect(canUseSpeechToText({ enabled_providers: ["neo"] }, { neo: "oauth" })).toBe(true)
  })

  it("normalizes configured and unknown transcription models", () => {
    expect(selectedSpeechToTextModel({ experimental: { speech_to_text_model: "google/chirp-3" } })).toBe(
      "google/chirp-3",
    )
    expect(selectedSpeechToTextModel({ experimental: { speech_to_text_model: "unknown/model" } })).toBe(
      DEFAULT_SPEECH_TO_TEXT_MODEL.id,
    )
  })
})
