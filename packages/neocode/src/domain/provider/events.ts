/**
 * Provider domain events
 */

import type { ProviderId, ModelId } from "@neocode-ai/shared/types"
import type { Model, Provider } from "./types"

export interface ProviderAddedEvent {
  type: "provider.added"
  providerId: ProviderId
  provider: Provider
  timestamp: number
}

export interface ModelAddedEvent {
  type: "model.added"
  providerId: ProviderId
  model: Model
  timestamp: number
}

export interface ModelUpdatedEvent {
  type: "model.updated"
  providerId: ProviderId
  model: Model
  timestamp: number
}

export interface ModelRemovedEvent {
  type: "model.removed"
  providerId: ProviderId
  modelId: ModelId
  timestamp: number
}

export interface ProviderEnabledEvent {
  type: "provider.enabled"
  providerId: ProviderId
  timestamp: number
}

export interface ProviderDisabledEvent {
  type: "provider.disabled"
  providerId: ProviderId
  timestamp: number
}

export type ProviderDomainEvent =
  | ProviderAddedEvent
  | ModelAddedEvent
  | ModelUpdatedEvent
  | ModelRemovedEvent
  | ProviderEnabledEvent
  | ProviderDisabledEvent

export interface IProviderEventPublisher {
  publish(event: ProviderDomainEvent): Promise<void>
}
