import axios, { type CreateAxiosDefaults, type InternalAxiosRequestConfig } from "axios"
import { IS_NODE } from "@/env"

class AxiosAdapter {
  fetchRequest: (typeof fetch) | null = null
  async getFetch() {
    if (this.fetchRequest) {
      return this.fetchRequest
    }
    if (IS_NODE) {
      return this.fetchRequest = fetch
    }
    else {
      return this.fetchRequest = await import('@tauri-apps/plugin-http').then(module => module.fetch) as typeof fetch
    }
  }
  get adapter() {
    const self = this
    return async function adapter(config: InternalAxiosRequestConfig) {
      const url = `${new URL(config.url!, config.baseURL)}?${new URLSearchParams(config.params ?? {})}`
      const fetch = await self.getFetch()

      const response = await fetch(url, {
        method: (config.method as string).toUpperCase(),
        headers: config.headers,
        body: config.data,
        credentials: config.withCredentials ? 'include' : 'omit'
      })

      try {
        const contentType = response.headers.get('Content-Type') ?? response.headers.get('content-type') ?? ''
        let data: any
        // 根据 content-type 类型处理数据
        if (contentType.includes('application/json')) {
          data = await response.json() // 解析为 json
        }
        else if (contentType.includes('application/octet-stream')) {
          data = await response.arrayBuffer() // 解析为 ArrayBuffer
        }
        else if (contentType.includes('text/')) {
          data = await response.text() // 解析为字符串
        }
        else if (contentType.includes('image/')) {
          data = await response.blob() // 解析为 Blob 对象
        }
        else {
          throw new Error(`无法处理这个 Content-Type: ${contentType}`)
        }

        const rawHeaders = Object.fromEntries(response.headers.entries())

        const resolveResponse = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...rawHeaders,
            'set-cookie': response.headers.getSetCookie(),
          },
          config,
          request: {}
        }

        return (resolveResponse)
      }
      catch (err: any) {
        return Promise.reject({
          message: err.message,
          config: config,
          response,
          request: {}
        })
      }
    }
  }
}

export const http = createAxiosInstance()

export function createAxiosInstance(config?: CreateAxiosDefaults) {
  return axios.create({
    ...config,
    adapter: new AxiosAdapter().adapter
  })
}
