/**
 * Provider aggregate root
 */

import type { Provider, Model } from "./types"
import { ProviderFactory, ModelNotFoundError, ProviderError } from "./types"

export class ProviderAggregate {
  private state: Provider

  constructor(state: Provider) {
    this.state = state
  }

  /**
   * Get current state (immutable)
   */
  getState(): Readonly<Provider> {
    return Object.freeze({ ...this.state })
  }

  /**
   * Add model
   */
  addModel(model: Model): void {
    this.state = ProviderFactory.addModel(this.state, model)
  }

  /**
   * Update model
   */
  updateModel(model: Model): void {
    this.state = ProviderFactory.updateModel(this.state, model)
  }

  /**
   * Remove model
   */
  removeModel(modelId: string): void {
    const exists = this.state.models.find((m) => m.id === modelId)
    if (!exists) {
      throw new ModelNotFoundError(modelId as any)
    }
    this.state = ProviderFactory.removeModel(this.state, modelId as any)
  }

  /**
   * Enable provider
   */
  enable(): void {
    this.state = ProviderFactory.setEnabled(this.state, true)
  }

  /**
   * Disable provider
   */
  disable(): void {
    this.state = ProviderFactory.setEnabled(this.state, false)
  }

  /**
   * Get model count
   */
  getModelCount(): number {
    return this.state.models.length
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.state.isEnabled
  }

  /**
   * Create from factory
   */
  static create = ProviderFactory.create
}
