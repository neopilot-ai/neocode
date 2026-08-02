import { buildNeoHeaders } from "../headers.js"
import type { NeoPassState } from "../types.js"
import { NEO_API_BASE } from "./constants.js"

function record(value: unknown) {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

export function parseNeoPassState(value: unknown): NeoPassState | null {
  const item = Array.isArray(value) ? value[0] : value
  const data = record(record(record(item)?.result)?.data)
  const root = record(data?.json) ?? data ?? record(value)
  const sub = record(root?.subscription)
  if (!sub || (sub.currentPeriodBaseCreditsUsd == null && sub.currentPeriodUsageUsd == null)) return null

  const next = sub.nextBillingAt ?? sub.nextRenewalAt
  return {
    currentPeriodBaseCreditsUsd: num(sub.currentPeriodBaseCreditsUsd),
    currentPeriodUsageUsd: num(sub.currentPeriodUsageUsd),
    currentPeriodBonusCreditsUsd: num(sub.currentPeriodBonusCreditsUsd),
    nextBillingAt: typeof next === "string" ? next : null,
  }
}

export async function fetchNeoPassState(token: string): Promise<NeoPassState | null> {
  try {
    const params = new URLSearchParams({ batch: "1", input: JSON.stringify({ "0": null }) })
    const response = await fetch(`${NEO_API_BASE}/api/trpc/neoPass.getState?${params}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...buildNeoHeaders() },
    })
    if (!response.ok) {
      console.warn(`Failed to fetch Neo Pass: ${response.status}`)
      return null
    }
    return parseNeoPassState(await response.json())
  } catch (err) {
    console.warn("Error fetching Neo Pass:", err)
    return null
  }
}
