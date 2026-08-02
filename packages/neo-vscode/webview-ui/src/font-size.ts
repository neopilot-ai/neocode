const DEFAULT_SIZE = 13
const SIZES = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]

export function clampFontSize(size: number) {
  if (!Number.isFinite(size)) return DEFAULT_SIZE
  return Math.min(24, Math.max(10, Math.round(size)))
}

export function readFontSize() {
  if (typeof window === "undefined") return DEFAULT_SIZE
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--neo-font-size-13")
  const size = Number.parseFloat(raw)
  return clampFontSize(size)
}

export function applyFontSize(size: number) {
  const base = clampFontSize(size)
  const root = document.documentElement
  for (const token of SIZES) {
    root.style.setProperty(`--neo-font-size-${token}`, `${(base * token) / DEFAULT_SIZE}px`)
  }
  root.style.setProperty("--neo-font-scale", String(base / DEFAULT_SIZE))
  root.style.setProperty("--font-size-x-small", "var(--neo-font-size-10)")
  root.style.setProperty("--font-size-small", "var(--neo-font-size-11)")
  root.style.setProperty("--font-size-base", "var(--neo-font-size-13)")
  root.style.setProperty("--font-size-large", "var(--neo-font-size-16)")
}
