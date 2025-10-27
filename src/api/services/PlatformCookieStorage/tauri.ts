import { IS_TAURI } from '@/env'
import { CookieStorage } from './interface'

export class TauriCookieStorage implements CookieStorage {
  private readonly COOKIE_KEY = 'cookie'
  private store: (typeof import('@tauri-apps/plugin-store').Store)['prototype'] | null = null

  private async getStore() {
    if (IS_TAURI && !this.store) {
      const { Store } = await import('@tauri-apps/plugin-store')
      this.store = await Store.load('.cookies.dat')
    }
    return this.store!
  }

  public async saveCookie(cookie: string): Promise<void> {
    const sotre = await this.getStore()
    await sotre.set(this.COOKIE_KEY, cookie)
    await sotre.save()
  }

  public async loadCookie(): Promise<string | null> {
    const sotre = await this.getStore()
    return (await sotre.get(this.COOKIE_KEY)) as string | null
  }

  public async clearCookie(): Promise<void> {
    const sotre = await this.getStore()
    await sotre.delete(this.COOKIE_KEY)
    await sotre.save()
  }
}

