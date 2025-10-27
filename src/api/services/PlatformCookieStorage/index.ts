import { IS_NODE, IS_TAURI } from '@/env'
import type { CookieStorage } from './interface'
import { TauriCookieStorage } from './tauri'
import { NodeCookieStorage } from './node'

export class PlatformCookieStorage {
  private constructor() {}

  static create(): CookieStorage {
    if (IS_TAURI) {
      return new TauriCookieStorage()
    }
    if (IS_NODE) {
      return new NodeCookieStorage()
    }
    throw new Error('Unsupported platform for CookieStorage')
  }
}
