export interface CookieStorage {
  saveCookie(cookie: string): Promise<void>
  loadCookie(): Promise<string | null>
  clearCookie(): Promise<void>
}
