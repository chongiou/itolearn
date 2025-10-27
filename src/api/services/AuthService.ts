import { itolearnClient } from '@/api/adapters'
import { sleepWithAbort } from '@/utils'
import { getLoginQrcodeStatus, createLoginQrcodeKey } from '@/api/adapters'
import { submitLogin as submitLoginAdapter } from '@/api/adapters/user'
import qr from 'qrcode'
import { startLoader } from '@/utils'
import type { CookieStorage } from './PlatformCookieStorage/interface'
import { PlatformCookieStorage } from './PlatformCookieStorage'

export class AuthService {
  constructor(
    private store: CookieStorage
  ) {}

  async saveCookie(cookie: string) {
    this.store.saveCookie(cookie)
  }

  async loadCookie(): Promise<string | null> {
    return this.store.loadCookie()
  }

  async clearCookie() {
    await this.store.clearCookie()
  }

  async hasValidCookie(): Promise<boolean> {
    const cookie = await this.loadCookie()
    if (!cookie) {
      return false
    }

    let isValid = false
    let retryCount = 0
    const maxRetryCount = 3
    while (retryCount < maxRetryCount) {
      const resp = await itolearnClient.request({
        url: 'http://gxic.itolearn.com/Student/getStudentInfo',
        headers: { cookie: cookie },
        method: 'GET',
      })
      const contentType = resp.headers['content-type']
      const success = contentType?.includes('application/json')
      if (success) {
        isValid = true
        break
      } else if (resp.status !== 200) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        retryCount += 1
      }
    }

    return isValid
  }

  async pollingScanAction(
    qrcodeKey: string,
    abortController: AbortController = new AbortController(),
    timeout: number = 2 * 60 * 1000
  ) {
    let isTimeout = false

    const abortTimeoutClearId = setTimeout(() => {
      isTimeout = true
      abortController.abort()
    }, timeout)

    try {
      while (!abortController.signal.aborted) {
        const response = await getLoginQrcodeStatus(qrcodeKey)
        if (response.scanned) {
          return {
            ...response,
            timeout: false
          }
        }
        await sleepWithAbort(2000, abortController.signal)
      }
      return {
        scanned: false,
        cookie: undefined,
        timeout: isTimeout
      }
    }

    finally {
      clearTimeout(abortTimeoutClearId)
    }
  }

  async submitLogin(username: string, password: string) {
    return await submitLoginAdapter(username, password)
  }

  async terminalLogin() {
    const qrcodeKey = await createLoginQrcodeKey()
    const qrcode = await qr.toString(qrcodeKey, { margin: 2 })
    console.log(qrcode)
    return startLoader('等待用户扫描', async stop => {
      const result = await this.pollingScanAction(qrcodeKey)
      if (result?.scanned) {
        stop(`已扫描: ${qrcodeKey}`)
        return result
      } else {
        console.error('超时')
        process.exit(1)
      }
    })
  }
}

export const authService = new AuthService(PlatformCookieStorage.create())
