export type NeoEmbeddingModel = {
  id: string
  name: string
  dimension: number
  scoreThreshold: number
  note?: string
}

export type NeoEmbeddingModelCatalog = {
  defaultModel: string
  models: NeoEmbeddingModel[]
  aliases: Record<string, string>
}

export const EMPTY_NEO_EMBEDDING_MODEL_CATALOG: NeoEmbeddingModelCatalog = {
  defaultModel: "",
  models: [],
  aliases: {},
}

export function normalizeNeoEmbeddingModelId(model: string | undefined, catalog = EMPTY_NEO_EMBEDDING_MODEL_CATALOG) {
  if (!model) return undefined
  return catalog.aliases[model] ?? model
}

export function getNeoEmbeddingModel(model: string | undefined, catalog = EMPTY_NEO_EMBEDDING_MODEL_CATALOG) {
  const id = normalizeNeoEmbeddingModelId(model, catalog)
  return catalog.models.find((item) => item.id === id)
}

export function formatNeoEmbeddingModelLabel(model: NeoEmbeddingModel): string {
  const note = model.note ? `${model.note}, ` : ""
  return `${model.name} (${note}${model.dimension}d)`
}
