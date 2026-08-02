import { createContext, createSignal, onCleanup, useContext, type Accessor, type ParentComponent } from "solid-js"
import {
  EMPTY_NEO_EMBEDDING_MODEL_CATALOG,
  type NeoEmbeddingModelCatalog,
} from "@neocode/neo-indexing/embedding-models"
import { useVSCode } from "./vscode"
import type { ExtensionMessage } from "../types/messages"

type NeoEmbeddingModelsContextValue = {
  catalog: Accessor<NeoEmbeddingModelCatalog>
}

export const NeoEmbeddingModelsContext = createContext<NeoEmbeddingModelsContextValue>()

export const NeoEmbeddingModelsProvider: ParentComponent = (props) => {
  const vscode = useVSCode()
  const [catalog, setCatalog] = createSignal<NeoEmbeddingModelCatalog>(EMPTY_NEO_EMBEDDING_MODEL_CATALOG)

  const unsubscribe = vscode.onMessage((message: ExtensionMessage) => {
    if (message.type !== "neoEmbeddingModelsLoaded") return
    setCatalog(message.catalog)
  })

  vscode.postMessage({ type: "requestNeoEmbeddingModels" })

  onCleanup(unsubscribe)

  return <NeoEmbeddingModelsContext.Provider value={{ catalog }}>{props.children}</NeoEmbeddingModelsContext.Provider>
}

export function useNeoEmbeddingModels(): NeoEmbeddingModelsContextValue {
  const context = useContext(NeoEmbeddingModelsContext)
  if (!context) {
    throw new Error("useNeoEmbeddingModels must be used within a NeoEmbeddingModelsProvider")
  }
  return context
}
