import type { Navigator } from "@solidjs/router"

let globalNavigate: Navigator | null = null

export function useGlobalNavigate() {
  return globalNavigate as Navigator
}

export function setupGlobalNavigate(navigate: Navigator) {
  globalNavigate = navigate
}
