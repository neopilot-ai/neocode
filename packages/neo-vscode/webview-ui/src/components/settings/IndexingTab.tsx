import { Component, For, Show, createMemo, createSignal } from "solid-js"
import { Button } from "@neocode/neo-ui/button"
import { Card } from "@neocode/neo-ui/card"
import { DEFAULT_VECTOR_STORE, isFileExtension, parseFileExtensions } from "@neocode/neo-indexing/config"
import { formatNeoEmbeddingModelLabel, getNeoEmbeddingModel } from "@neocode/neo-indexing/embedding-models"
import { Select } from "@neocode/neo-ui/select"
import { Switch } from "@neocode/neo-ui/switch"
import { TextField } from "@neocode/neo-ui/text-field"
import { useConfig } from "../../context/config"
import { formatIndexingLabel, useIndexing } from "../../context/indexing"
import { useNeoEmbeddingModels } from "../../context/neo-embedding-models"
import { useLanguage } from "../../context/language"
import { useProvider } from "../../context/provider"
import { useServer } from "../../context/server"
import type { IndexingConfig, IndexingProvider as ProviderId } from "../../types/messages"
import { NEO_PROVIDER_ID } from "../../../../src/shared/provider-model"
import SettingsRow from "./SettingsRow"
import {
  indexingConfig,
  indexingDescription,
  indexingEnabled,
  indexingEnabledInherited,
  indexingInheritance,
  indexingSource,
  indexingUpdate,
  type IndexingScope,
  type IndexingSource,
} from "./indexing-tab-state"

type Option = { value: string; label: string }
type TuningKey = "searchMinScore" | "searchMaxResults" | "embeddingBatchSize" | "scannerMaxBatchRetries"

const allProviders: { value: ProviderId; label: string }[] = [
  { value: "neo", label: "Neo" },
  { value: "openai", label: "OpenAI" },
  { value: "ollama", label: "Ollama (local)" },
  { value: "openai-compatible", label: "OpenAI-Compatible" },
  { value: "gemini", label: "Gemini" },
  { value: "mistral", label: "Mistral" },
  { value: "vercel-ai-gateway", label: "Vercel AI Gateway" },
  { value: "bedrock", label: "AWS Bedrock" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "voyage", label: "Voyage" },
]

const stores: Option[] = [
  { value: "lancedb", label: "LanceDB (default)" },
  { value: "qdrant", label: "Qdrant" },
]

const tuning: Array<{ key: TuningKey; label: string; placeholder: string }> = [
  { key: "searchMinScore", label: "Search Min Score", placeholder: "0.4" },
  { key: "searchMaxResults", label: "Search Max Results", placeholder: "50" },
  { key: "embeddingBatchSize", label: "Embedding Batch Size", placeholder: "60" },
  { key: "scannerMaxBatchRetries", label: "Scanner Max Batch Retries", placeholder: "3" },
]

function sourceLabel(source: IndexingSource) {
  if (source === "global") return "Global"
  if (source === "local") return "Local"
  if (source === "mixed") return "Global + Local"
  if (source === "default") return "Default"
  return ""
}

function providerFields(provider: ProviderId | undefined): Array<{ key: string; label: string; placeholder: string }> {
  if (provider === "neo") return []
  if (provider === "openai") return [{ key: "apiKey", label: "API Key", placeholder: "sk-..." }]
  if (provider === "ollama") return [{ key: "baseUrl", label: "Base URL", placeholder: "http://localhost:11434" }]
  if (provider === "openai-compatible") {
    return [
      { key: "baseUrl", label: "Base URL", placeholder: "https://api.example.com/v1" },
      { key: "apiKey", label: "API Key (optional)", placeholder: "sk-..." },
    ]
  }
  if (provider === "gemini") return [{ key: "apiKey", label: "API Key", placeholder: "AI..." }]
  if (provider === "mistral") return [{ key: "apiKey", label: "API Key", placeholder: "..." }]
  if (provider === "vercel-ai-gateway") return [{ key: "apiKey", label: "API Key", placeholder: "..." }]
  if (provider === "bedrock") {
    return [
      { key: "region", label: "AWS Region", placeholder: "us-east-1" },
      { key: "profile", label: "AWS Profile", placeholder: "default" },
    ]
  }
  if (provider === "openrouter") {
    return [
      { key: "apiKey", label: "API Key", placeholder: "sk-or-..." },
      { key: "specificProvider", label: "Specific Provider", placeholder: "optional" },
    ]
  }
  if (provider === "voyage") return [{ key: "apiKey", label: "API Key", placeholder: "pa-..." }]
  return []
}

const IndexingTab: Component = () => {
  const { globalConfig, projectConfig, settings, updateGlobalConfig, updateProjectConfig, updateSetting } = useConfig()
  const indexing = useIndexing()
  const embeds = useNeoEmbeddingModels()
  const language = useLanguage()
  const provider = useProvider()
  const server = useServer()
  const [providerDrafts, setProviderDrafts] = createSignal<Record<string, string>>({})
  const [storeDrafts, setStoreDrafts] = createSignal<Record<string, string>>({})
  const [tuningDrafts, setTuningDrafts] = createSignal<Record<string, string>>({})
  const [extensionDrafts, setExtensionDrafts] = createSignal<Record<string, string>>({})
  const [extensionErrors, setExtensionErrors] = createSignal<Record<string, string>>({})
  const [scope, setScope] = createSignal<IndexingScope>("global")

  const globalCfg = createMemo<IndexingConfig>(() => globalConfig().indexing ?? {})
  const projectCfg = createMemo<IndexingConfig>(() => projectConfig().indexing ?? {})
  const raw = createMemo<IndexingConfig>(() => (scope() === "global" ? globalCfg() : projectCfg()))
  const cfg = createMemo<IndexingConfig>(() => indexingConfig(scope(), globalCfg(), projectCfg()))
  const enabled = createMemo(() => indexingEnabled(scope(), globalCfg(), projectCfg()))
  const inherited = createMemo(() => indexingEnabledInherited(scope(), globalCfg(), projectCfg()))
  const inheritance = (paths: readonly (readonly string[])[]) =>
    indexingInheritance(scope(), globalCfg(), projectCfg(), paths)
  const tag = (current: IndexingScope, paths: readonly (readonly string[])[]) =>
    sourceLabel(indexingSource(current, globalCfg(), projectCfg(), paths)) || undefined
  const description = (value: string, paths: readonly (readonly string[])[]) =>
    indexingDescription(value, inheritance(paths))
  const changeScope = (next: IndexingScope) => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
    setScope(next)
  }

  const updateIndexing = (partial: IndexingConfig) => {
    const patch = { indexing: indexingUpdate(scope(), globalCfg(), projectCfg(), partial) }
    if (scope() === "global") {
      updateGlobalConfig(patch)
      return
    }
    updateProjectConfig(patch)
  }

  const vectorStore = () => cfg().vectorStore ?? DEFAULT_VECTOR_STORE
  const neoDefault = () =>
    getNeoEmbeddingModel(embeds.catalog().defaultModel, embeds.catalog())?.id ?? embeds.catalog().defaultModel
  const neoModels = createMemo(() =>
    embeds.catalog().models.map((model) => ({
      value: model.id,
      label: formatNeoEmbeddingModelLabel(model),
    })),
  )
  const knownNeoModel = (model: string | null | undefined) =>
    getNeoEmbeddingModel(model ?? undefined, embeds.catalog())?.id
  const neoValue = () => knownNeoModel(cfg().model) ?? neoDefault()
  const neoAvailable = () => !!server.profileData() || provider.authStates()[NEO_PROVIDER_ID] !== undefined
  const selectedProvider = () => cfg().provider ?? (neoAvailable() ? "neo" : undefined)
  const staleNeoModel = () => selectedProvider() === "neo" && !!cfg().model && !knownNeoModel(cfg().model)
  const providers = createMemo(() =>
    allProviders.filter((item) => item.value !== "neo" || neoAvailable() || selectedProvider() === "neo"),
  )
  const fields = createMemo(() => providerFields(selectedProvider()))

  const saveProvider = (next: ProviderId | undefined) => {
    if (next === "neo") {
      const model = knownNeoModel(cfg().model) ?? (neoDefault() || null)
      updateIndexing({
        provider: next,
        model,
        dimension: null,
      })
      return
    }
    updateIndexing({ provider: next, model: null, dimension: null })
  }

  const saveEnabled = (enabled: boolean) => {
    if (enabled && !cfg().provider && neoAvailable()) {
      updateIndexing({
        enabled,
        provider: "neo",
        model: knownNeoModel(cfg().model) ?? (neoDefault() || null),
        dimension: null,
      })
      return
    }
    updateIndexing({ enabled })
  }

  const saveModel = (value: string) => {
    if (selectedProvider() === "neo") return
    const trimmed = value.trim()
    updateIndexing({ model: trimmed || null })
  }

  const providerValue = (group: string, key: string) => {
    const draftKey = `${scope()}.${group}.${key}`
    const draft = providerDrafts()[draftKey]
    if (draft !== undefined) return draft
    const value = (cfg()[group as keyof IndexingConfig] as Record<string, string | undefined> | undefined)?.[key]
    return value ?? ""
  }

  const storeValue = (group: "qdrant" | "lancedb", key: string) => {
    const draftKey = `${scope()}.${group}.${key}`
    const draft = storeDrafts()[draftKey]
    if (draft !== undefined) return draft
    const value = (cfg()[group] as Record<string, string | undefined> | undefined)?.[key]
    return value ?? ""
  }

  const saveProviderField = (group: ProviderId, key: string, value: string) => {
    const current = (raw()[group] as Record<string, string | undefined> | undefined) ?? {}
    updateIndexing({ [group]: { ...current, [key]: value.trim() || undefined } })
    const draftKey = `${scope()}.${group}.${key}`
    setProviderDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([entry]) => entry !== draftKey)))
  }

  const saveStoreField = (group: "qdrant" | "lancedb", key: string, value: string) => {
    const current = (raw()[group] as Record<string, string | undefined> | undefined) ?? {}
    updateIndexing({ [group]: { ...current, [key]: value.trim() || undefined } })
    const draftKey = `${scope()}.${group}.${key}`
    setStoreDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([entry]) => entry !== draftKey)))
  }

  const saveNumber = (
    key: TuningKey | "dimension",
    value: string,
    options?: { integer?: boolean; min?: number; max?: number },
  ) => {
    const trimmed = value.trim()
    if (!trimmed) {
      updateIndexing({ [key]: key === "dimension" ? null : undefined })
      if (key !== "dimension") {
        const draftKey = `${scope()}.${key}`
        setTuningDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([entry]) => entry !== draftKey)))
      }
      return
    }

    const num = Number(trimmed)
    if (Number.isNaN(num)) return
    if (options?.integer && !Number.isInteger(num)) return
    if (options?.min !== undefined && num < options.min) return
    if (options?.max !== undefined && num > options.max) return
    updateIndexing({ [key]: num })
    if (key !== "dimension") {
      const draftKey = `${scope()}.${key}`
      setTuningDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([entry]) => entry !== draftKey)))
    }
  }

  const tuningValue = (key: TuningKey) => {
    const draft = tuningDrafts()[`${scope()}.${key}`]
    if (draft !== undefined) return draft
    const value = cfg()[key]
    return value === undefined ? "" : String(value)
  }

  const extensionValue = () => {
    const draft = extensionDrafts()[scope()]
    if (draft !== undefined) return draft
    return cfg().fileExtensions?.join(", ") ?? ""
  }

  const saveExtensions = (value: string) => {
    const values = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    const invalid = values.find((item) => !isFileExtension(item))
    if (invalid) {
      setExtensionErrors((prev) => ({
        ...prev,
        [scope()]: language.t("settings.indexing.fileExtensions.invalid", { extension: invalid }),
      }))
      return
    }
    updateIndexing({ fileExtensions: parseFileExtensions(value) })
    setExtensionDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([entry]) => entry !== scope())))
    setExtensionErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([entry]) => entry !== scope())))
  }

  const content = (_scope: IndexingScope) => (
    <div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
      <Card>
        <SettingsRow title={language.t("settings.indexing.status.title")} description={indexing.status().message}>
          <span class={`indexing-status-badge indexing-status-badge--${indexing.tone()}`}>
            {formatIndexingLabel(indexing.status())}
          </span>
        </SettingsRow>
        <SettingsRow
          title="Configuration scope"
          description={
            scope() === "global"
              ? language.t("settings.indexing.globalEnable.description")
              : language.t("settings.indexing.projectEnable.description")
          }
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant={scope() === "global" ? "primary" : "secondary"}
              size="small"
              onClick={() => changeScope("global")}
            >
              {language.t("settings.config.scope.global")}
            </Button>
            <Button
              variant={scope() === "project" ? "primary" : "secondary"}
              size="small"
              onClick={() => changeScope("project")}
            >
              {language.t("settings.config.scope.local")}
            </Button>
          </div>
        </SettingsRow>
        <SettingsRow
          title={
            scope() === "global"
              ? language.t("settings.indexing.globalEnable.title")
              : language.t("settings.indexing.projectEnable.title")
          }
          description={
            inherited()
              ? `Inherited from global config (${enabled() ? "on" : "off"}) until a project value is saved.`
              : language.t("settings.indexing.enable.description")
          }
          tag={() => tag(scope(), [["enabled"]])}
        >
          <Switch checked={enabled()} onChange={saveEnabled} hideLabel>
            {language.t("settings.indexing.enable.title")}
          </Switch>
        </SettingsRow>
        <SettingsRow
          title={language.t("settings.indexing.showButton.title")}
          description={language.t("settings.indexing.showButton.description")}
          last
        >
          <Switch
            checked={Boolean(settings()["indexing.showButtonWhenDisabled"] ?? true)}
            onChange={(checked) => updateSetting("indexing.showButtonWhenDisabled", checked)}
            hideLabel
          >
            {language.t("settings.indexing.showButton.title")}
          </Switch>
        </SettingsRow>
      </Card>

      <Card>
        <SettingsRow
          title={language.t("settings.indexing.provider.title")}
          description={description(language.t("settings.indexing.provider.description"), [["provider"]])}
          tag={() => tag(scope(), [["provider"]])}
        >
          <Select
            options={providers()}
            current={providers().find((item) => item.value === selectedProvider())}
            value={(item) => item.value}
            label={(item) => item.label}
            onSelect={(item) => saveProvider(item?.value as ProviderId | undefined)}
            variant="secondary"
            size="small"
            triggerVariant="settings"
            placeholder={language.t("settings.providers.notSet")}
          />
        </SettingsRow>
        <Show when={selectedProvider() === "neo"}>
          <Show when={neoModels().length > 0}>
            <SettingsRow
              title={language.t("settings.indexing.neoModel.title")}
              description={description(language.t("settings.indexing.neoModel.description"), [["model"]])}
              tag={() => tag(scope(), [["model"]])}
            >
              <Select
                options={neoModels()}
                current={neoModels().find((item) => item.value === neoValue())}
                value={(item) => item.value}
                label={(item) => item.label}
                onSelect={(item) => updateIndexing({ model: item?.value ?? neoDefault(), dimension: null })}
                variant="secondary"
                size="small"
                triggerVariant="settings"
                placeholder="Select a model"
              />
            </SettingsRow>
          </Show>
        </Show>
        <Show when={selectedProvider() !== "neo"}>
          <SettingsRow
            title={language.t("settings.indexing.model.title")}
            description={description(language.t("settings.indexing.model.description"), [["model"]])}
            tag={() => tag(scope(), [["model"]])}
          >
            <TextField value={cfg().model ?? ""} placeholder="Enter model ID" onChange={saveModel} />
          </SettingsRow>
        </Show>
        <SettingsRow
          title={language.t("settings.indexing.dimension.title")}
          description={
            selectedProvider() === "neo"
              ? language.t("settings.indexing.dimension.description")
              : description(language.t("settings.indexing.dimension.description"), [["dimension"]])
          }
          tag={() => (selectedProvider() === "neo" ? undefined : tag(scope(), [["dimension"]]))}
          last={!selectedProvider() || (fields().length === 0 && !(selectedProvider() === "neo" && !neoAvailable()))}
        >
          <TextField
            value={
              staleNeoModel() || cfg().dimension === undefined || cfg().dimension === null
                ? ""
                : String(cfg().dimension)
            }
            placeholder={
              selectedProvider() === "neo" ? "Provided by Neo" : language.t("settings.indexing.dimension.placeholder")
            }
            disabled={selectedProvider() === "neo"}
            onChange={(value) => saveNumber("dimension", value, { integer: true, min: 1 })}
          />
        </SettingsRow>
        <Show when={selectedProvider() === "neo" && !neoAvailable()}>
          <SettingsRow
            title={language.t("settings.indexing.neoSignIn.title")}
            description={language.t("settings.indexing.neoSignIn.description")}
            last
          >
            <span />
          </SettingsRow>
        </Show>
        <Show when={fields().length > 0 ? selectedProvider() : undefined} keyed>
          {(group) => {
            const fields = providerFields(group)
            const name = allProviders.find((item) => item.value === group)?.label ?? group
            return (
              <For each={fields}>
                {(field, index) => (
                  <SettingsRow
                    title={`${name} ${field.label}`}
                    description={description(language.t("settings.indexing.providerField.description"), [
                      [group, field.key],
                    ])}
                    tag={() => tag(scope(), [[group, field.key]])}
                    last={index() === fields.length - 1}
                  >
                    <TextField
                      type={field.key === "apiKey" ? "password" : undefined}
                      value={providerValue(group, field.key)}
                      placeholder={field.placeholder}
                      onInput={(e: InputEvent) => {
                        const target = e.currentTarget as HTMLInputElement
                        setProviderDrafts((prev) => ({ ...prev, [`${scope()}.${group}.${field.key}`]: target.value }))
                      }}
                      onBlur={(e: FocusEvent) => {
                        const target = e.currentTarget as HTMLInputElement
                        saveProviderField(group, field.key, target.value)
                      }}
                    />
                  </SettingsRow>
                )}
              </For>
            )
          }}
        </Show>
      </Card>

      <Card>
        <SettingsRow
          title={language.t("settings.indexing.vectorStore.title")}
          description={description(language.t("settings.indexing.vectorStore.description"), [["vectorStore"]])}
          tag={() => tag(scope(), [["vectorStore"]])}
        >
          <Select
            options={stores}
            current={stores.find((item) => item.value === vectorStore())}
            value={(item) => item.value}
            label={(item) => item.label}
            onSelect={(item) => updateIndexing({ vectorStore: item?.value as "lancedb" | "qdrant" | undefined })}
            variant="secondary"
            size="small"
            triggerVariant="settings"
          />
        </SettingsRow>
        <Show
          when={vectorStore() === "qdrant"}
          fallback={
            <SettingsRow
              title={language.t("settings.indexing.lancedbDirectory.title")}
              description={description(language.t("settings.indexing.lancedbDirectory.description"), [
                ["lancedb", "directory"],
              ])}
              tag={() => tag(scope(), [["lancedb", "directory"]])}
              last
            >
              <TextField
                value={storeValue("lancedb", "directory")}
                placeholder={language.t("settings.indexing.lancedbDirectory.placeholder")}
                onInput={(e: InputEvent) => {
                  const target = e.currentTarget as HTMLInputElement
                  setStoreDrafts((prev) => ({ ...prev, [`${scope()}.lancedb.directory`]: target.value }))
                }}
                onBlur={(e: FocusEvent) => {
                  const target = e.currentTarget as HTMLInputElement
                  saveStoreField("lancedb", "directory", target.value)
                }}
              />
            </SettingsRow>
          }
        >
          <>
            <SettingsRow
              title={language.t("settings.indexing.qdrantUrl.title")}
              description={description(language.t("settings.indexing.qdrantUrl.description"), [["qdrant", "url"]])}
              tag={() => tag(scope(), [["qdrant", "url"]])}
            >
              <TextField
                value={storeValue("qdrant", "url")}
                placeholder="http://localhost:6333"
                onInput={(e: InputEvent) => {
                  const target = e.currentTarget as HTMLInputElement
                  setStoreDrafts((prev) => ({ ...prev, [`${scope()}.qdrant.url`]: target.value }))
                }}
                onBlur={(e: FocusEvent) => {
                  const target = e.currentTarget as HTMLInputElement
                  saveStoreField("qdrant", "url", target.value)
                }}
              />
            </SettingsRow>
            <SettingsRow
              title={language.t("settings.indexing.qdrantApiKey.title")}
              description={description(language.t("settings.indexing.qdrantApiKey.description"), [
                ["qdrant", "apiKey"],
              ])}
              tag={() => tag(scope(), [["qdrant", "apiKey"]])}
              last
            >
              <TextField
                type="password"
                value={storeValue("qdrant", "apiKey")}
                placeholder={language.t("settings.indexing.qdrantApiKey.placeholder")}
                onInput={(e: InputEvent) => {
                  const target = e.currentTarget as HTMLInputElement
                  setStoreDrafts((prev) => ({ ...prev, [`${scope()}.qdrant.apiKey`]: target.value }))
                }}
                onBlur={(e: FocusEvent) => {
                  const target = e.currentTarget as HTMLInputElement
                  saveStoreField("qdrant", "apiKey", target.value)
                }}
              />
            </SettingsRow>
          </>
        </Show>
      </Card>

      <Card>
        <SettingsRow
          title={language.t("settings.indexing.fileExtensions.title")}
          description={description(language.t("settings.indexing.fileExtensions.description"), [["fileExtensions"]])}
          tag={() => tag(scope(), [["fileExtensions"]])}
        >
          <TextField
            value={extensionValue()}
            error={extensionErrors()[scope()]}
            validationState={extensionErrors()[scope()] ? "invalid" : "valid"}
            placeholder=".php, .js, .css"
            onInput={(e: InputEvent) => {
              const target = e.currentTarget as HTMLInputElement
              setExtensionDrafts((prev) => ({ ...prev, [scope()]: target.value }))
            }}
            onBlur={(e: FocusEvent) => {
              const target = e.currentTarget as HTMLInputElement
              saveExtensions(target.value)
            }}
          />
        </SettingsRow>
        <For each={tuning}>
          {(item, index) => (
            <SettingsRow
              title={item.label}
              description={description(language.t("settings.indexing.tuning.description"), [[item.key]])}
              tag={() => tag(scope(), [[item.key]])}
              last={index() === tuning.length - 1}
            >
              <TextField
                value={tuningValue(item.key)}
                placeholder={item.placeholder}
                onInput={(e: InputEvent) => {
                  const target = e.currentTarget as HTMLInputElement
                  setTuningDrafts((prev) => ({ ...prev, [`${scope()}.${item.key}`]: target.value }))
                }}
                onBlur={(e: FocusEvent) => {
                  const target = e.currentTarget as HTMLInputElement
                  const integer = item.key !== "searchMinScore"
                  const max = item.key === "searchMinScore" ? 1 : undefined
                  saveNumber(item.key, target.value, { integer, min: 0, max })
                }}
              />
            </SettingsRow>
          )}
        </For>
      </Card>
    </div>
  )

  return (
    <Show when={scope()} keyed>
      {content}
    </Show>
  )
}

export default IndexingTab
