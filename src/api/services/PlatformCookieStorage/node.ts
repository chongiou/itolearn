import { CookieStorage } from './interface'

export class NodeCookieStorage implements CookieStorage {
  private async getCookieFilepathForNode() {
    const path = await import('node:path')
    return path.resolve(import.meta.dirname, '../data/cookie.txt')
  }

  public async saveCookie(cookie: string): Promise<void> {
    const fs = await import('node:fs')
    const cookieFilepath = await this.getCookieFilepathForNode()
    fs.writeFileSync(cookieFilepath, cookie)
  }

  public async loadCookie(): Promise<string | null> {
    const fs = await import('node:fs')
    const cookieFilepath = await this.getCookieFilepathForNode()
    if (!fs.existsSync(cookieFilepath)) return null
    return fs.readFileSync(cookieFilepath, { encoding: 'utf8' })
  }

  public async clearCookie(): Promise<void> {
    const fs = await import('node:fs')
    const cookieFilepath = await this.getCookieFilepathForNode()
    if (fs.existsSync(cookieFilepath)) {
      fs.unlinkSync(cookieFilepath)
    }
  }
}

export const storage = new NodeCookieStorage()
