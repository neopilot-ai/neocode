import { z } from "zod"
import { NEO_API_BASE } from "./constants.js"
import { getDefaultHeaders, buildNeoHeaders } from "../headers.js"

/**
 * Neo notification schema
 */
export const NeocodeNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  action: z
    .object({
      actionText: z.string(),
      actionURL: z.string(),
    })
    .optional(),
  showIn: z.array(z.string()).optional(),
  suggestModelId: z.string().optional(),
})

export type NeocodeNotification = z.infer<typeof NeocodeNotificationSchema>

const NotificationsResponseSchema = z.object({
  notifications: z.array(NeocodeNotificationSchema),
})

const NOTIFICATIONS_TIMEOUT_MS = 5000

/**
 * Fetch notifications from Neo API
 *
 * @param options - Configuration with token and optional organization ID
 * @returns Array of notifications from the Neo API (clients filter by showIn)
 */
export async function fetchNeocodeNotifications(options: {
  neocodeToken?: string
  neocodeOrganizationId?: string
}): Promise<NeocodeNotification[]> {
  const token = options.neocodeToken
  if (!token) return []

  const url = `${NEO_API_BASE}/api/users/notifications`

  try {
    const response = await fetch(url, {
      headers: {
        ...getDefaultHeaders(),
        ...buildNeoHeaders(undefined, { neocodeOrganizationId: options.neocodeOrganizationId }),
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(NOTIFICATIONS_TIMEOUT_MS),
    })

    if (!response.ok) return []

    const json = await response.json()
    const result = NotificationsResponseSchema.safeParse(json)

    if (!result.success) return []

    return result.data.notifications
  } catch {
    return []
  }
}
