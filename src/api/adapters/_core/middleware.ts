import { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { authService } from '../../services/AuthService'
import { loginStateManager } from '../../services/LoginStateManager'

const isLoginResp = (resp: AxiosResponse) => {
  if (
    typeof resp.data === 'string' &&
    resp.data.includes('<title>学会学</title>') &&
    resp.data.includes('<!-- 登录div -->') &&
    resp.data.includes('<div class="login">')
  ) {
    return true
  }

  return false
}

export async function carryCookieRequestInterceptor(conf: InternalAxiosRequestConfig) {
  // 登录接口不要携带旧的 cookie, 否则后端不会发新的 cookie
  const whitelist = ['Account/QrLogin', '/Account/LoginProcess']
  if (whitelist.some((it) => conf.url?.includes(it))) {
    conf.headers.cookie = null
    conf.withCredentials = false
    return conf
  }
  const cookie = await authService.loadCookie()
  if (cookie) conf.headers.cookie = cookie
  return conf
}

export async function saveCookieResponseInterceptor(resp: AxiosResponse) {
  const cookie = resp.headers['set-cookie']?.find((c) => c.includes('ASP.NET_SessionId'))
  if (cookie) {
    await authService.saveCookie(cookie)
  }
  return resp
}

export async function loginStatusCheckResponseInterceptor(resp: AxiosResponse): Promise<AxiosResponse> {
  if (isLoginResp(resp)) {
    // 检测到登录状态失效，通知上层处理
    await loginStateManager.notifyLoginRequired({
      originalRequest: resp.config,
    })

    // 返回一个pending的Promise，阻止请求继续传播
    return new Promise(() => {})
  }

  return resp
}
