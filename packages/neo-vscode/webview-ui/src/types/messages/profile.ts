// Neo notification types (mirrored from neo-gateway)
export interface NeocodeNotificationAction {
  actionText: string
  actionURL: string
}

export interface NeocodeNotification {
  id: string
  title: string
  message: string
  action?: NeocodeNotificationAction
  showIn?: string[]
  suggestModelId?: string
}

// Profile types from neo-gateway
export interface NeocodeBalance {
  balance: number
}

export interface NeoPassState {
  currentPeriodBaseCreditsUsd: number
  currentPeriodUsageUsd: number
  currentPeriodBonusCreditsUsd: number
  nextBillingAt?: string | null
}

export interface ProfileData {
  profile: {
    email: string
    name?: string
    organizations?: Array<{ id: string; name: string; role: string }>
    selectedOrganizationId?: string
    hasPersonalAccount?: boolean
  }
  balance: NeocodeBalance | null
  neoPass: NeoPassState | null
  currentOrgId: string | null
}
