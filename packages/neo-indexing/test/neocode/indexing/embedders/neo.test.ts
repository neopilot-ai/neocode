import { beforeEach, describe, expect, mock, test } from "bun:test"
import { mockEmbeddingsCreate, openAIMockFactory, setOpenAIConstructorHook } from "./__helpers__/openai-mock"

mock.module("openai", openAIMockFactory)

import { NeoEmbedder, NEO_INDEXING_FEATURE } from "../../../../src/indexing/embedders/neo"

describe("NeoEmbedder", () => {
  beforeEach(() => {
    mockEmbeddingsCreate.mockReset()
    setOpenAIConstructorHook(undefined)
  })

  test("uses Neo Gateway headers and configured embedding model", async () => {
    const seen: unknown[] = []
    setOpenAIConstructorHook((cfg) => seen.push(cfg))
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2] }],
      usage: { prompt_tokens: 1, total_tokens: 1 },
    })

    const embedder = new NeoEmbedder({
      apiKey: "neo-token",
      organizationId: "org_123",
      modelId: "mistralai/mistral-embed-2312",
    })

    await embedder.createEmbeddings(["hello"])

    expect(seen[0]).toEqual({
      baseURL: "https://api.neo.khulnasoft.com/api/gateway/",
      apiKey: "neo-token",
      defaultHeaders: {
        "X-NEOCODE-FEATURE": NEO_INDEXING_FEATURE,
        "X-NEOCODE-ORGANIZATIONID": "org_123",
      },
    })
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
      input: ["hello"],
      model: "mistralai/mistral-embed-2312",
      encoding_format: "base64",
    })
  })

  test("normalizes custom gateway base URLs", () => {
    const seen: unknown[] = []
    setOpenAIConstructorHook((cfg) => seen.push(cfg))

    new NeoEmbedder({
      apiKey: "neo-token",
      baseUrl: "https://example.test/api/openrouter/",
      modelId: "mistralai/mistral-embed-2312",
    })

    expect((seen[0] as { baseURL: string }).baseURL).toBe("https://example.test/api/gateway/")
  })
})
