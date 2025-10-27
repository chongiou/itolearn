import { IS_TAURI, IS_NODE } from "@/env"
import type { StateStorage } from "./interface"
import { NodeStateStorage } from "./node"
import { TauriStateStorage } from "./tauri"

export class PlatformStateStorage {
  static create(): StateStorage {
    if (IS_TAURI) {
      return new TauriStateStorage()
    }
    if (IS_NODE) {
      return new NodeStateStorage()
    }
    throw new Error('不支持这个环境')
  }

  private constructor() { }
}

export * from './interface'
