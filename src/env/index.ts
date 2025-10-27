export const IS_NODE = typeof process !== "undefined" && process.versions?.node
export const IS_TAURI: boolean = !!(window as any).isTauri
export const IS_BROWSER = typeof window !== "undefined" && !IS_TAURI
export type Platform = "tauri" | "node" | "browser" | "unknown"

export function detectPlatform(): Platform {
  if (IS_TAURI) return "tauri"
  if (IS_NODE) return "node"
  if (IS_BROWSER) return "browser"
  return "unknown"
}
