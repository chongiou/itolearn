import { saveCookieResponseInterceptor, loginStatusCheckResponseInterceptor, carryCookieRequestInterceptor } from "../_core/middleware"
import { createAxiosInstance } from "@/platform"

export const itolearnClient = createAxiosInstance({
  baseURL: 'http://gxic.itolearn.com',
})

itolearnClient.interceptors.request.use(carryCookieRequestInterceptor)
itolearnClient.interceptors.response.use(saveCookieResponseInterceptor)
itolearnClient.interceptors.response.use(loginStatusCheckResponseInterceptor)
