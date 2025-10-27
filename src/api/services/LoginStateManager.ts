import { EventEmitter } from '@/utils/EventEmitter'
import { authService } from './AuthService'
import { useGlobalNavigate } from '@/store/navigation'
import { IS_NODE, IS_TAURI } from '@/env'

// TODO: 实现这个接口
interface AccountStorage {
  loadAccount: () => Promise<{ username: string; password: string } | null>
  saveAccount: (account: { username: string; password: string }) => Promise<void>
  clearAccount: () => Promise<void>
}

export interface LoginRequiredEvent {
  originalRequest?: any
  retry?: () => Promise<any>
}

export class LoginStateManager {
  private eventEmitter = new EventEmitter()
  private isHandlingLogin = false

  onLoginRequired(callback: (event: LoginRequiredEvent) => Promise<void>) {
    this.eventEmitter.on('loginRequired', callback)
  }

  offLoginRequired(callback: (event: LoginRequiredEvent) => Promise<void>) {
    this.eventEmitter.off('loginRequired', callback)
  }

  async notifyLoginRequired(event: LoginRequiredEvent = {}) {
    if (this.isHandlingLogin) {
      return
    }

    this.isHandlingLogin = true
    try {
      this.eventEmitter.emit('loginRequired', event)
    } finally {
      this.isHandlingLogin = false
    }
  }

  async handleLogin(): Promise<void> {
    if (IS_NODE) {
      const isLogin = await this.handleNodeLogin()
      if (!isLogin) {
        throw new Error('登录失败')
      }
      return
    }
    if (IS_TAURI) {
      await this.handleTauriLogin()
    }
  }

  async handleTauriLogin() {
    console.warn('[LoginStateManager] 登录状态失效或不存在，跳转至登录页')
    // TODO: 需要实现使用保存的账号密码自动登录的逻辑
    const nav = useGlobalNavigate()
    nav('/account/login')
  }

  // TODO: 需要继续抽象账号登录逻辑, 以便后续实现自动登录
  async handleNodeLogin(): Promise<boolean> {
    const { existsSync, readFileSync } = await import('node:fs')
    const path = await import('node:path')

    const accountFilepath = path.resolve(import.meta.dirname, '../config/account.json')
    const isAccountExist = existsSync(accountFilepath)

    let isLogin: boolean = false
    let cookie: null | string = null

    if (isAccountExist) {
      console.warn('[LoginStateManager] 登录状态失效, 使用账号密码登录')
      const account = JSON.parse(readFileSync(accountFilepath).toString())
      const res = await authService.submitLogin(account.username, account.password)
      isLogin = res.success
      cookie = res.cookie?.find((c) => c.includes('ASP.NET_SessionId')) ?? null
    } else {
      console.warn('[LoginStateManager] 登录状态失效, 请扫描二维码登录')
      const res = await authService.terminalLogin()
      isLogin = res.scanned
      cookie = res.cookie?.find((c) => c.includes('ASP.NET_SessionId')) ?? null
    }

    if (isLogin && cookie) {
      await authService.saveCookie(cookie)
      return true
    } else {
      console.error('❌ 登录失败')
      return false
    }
  }
}

export const loginStateManager = new LoginStateManager()
