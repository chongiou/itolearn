import type { Logger } from '@/utils/logger'
import type { PollerState } from '../types'
import { StateStorage } from './interface'

/**
 * 保存到 projectRoot/data/
 */
export class NodeStateStorage implements StateStorage {
  private projectRoot: string | null = null
  
  private async getProjectRoot(): Promise<string> {
    if (this.projectRoot) {
      return this.projectRoot
    }
    const { dirname, resolve } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const fs = await import('node:fs')

    const __dirname = dirname(fileURLToPath(import.meta.url))

    function findProjectRoot(startDir = __dirname) {
      let dir = startDir
      while (dir !== resolve(dir, '..')) {
        if (fs.existsSync(resolve(dir, 'package.json'))) {
          return dir
        }
        dir = resolve(dir, '..')
      }
      throw new Error('找不到项目根目录')
    }

    const projectRoot = findProjectRoot()
    this.projectRoot = projectRoot
    return projectRoot
  }

  public async readState(logger: Logger): Promise<PollerState> {
    const fs = await import('node:fs/promises')
    const { resolve } = await import('node:path')
    const projectRoot = await this.getProjectRoot()
    
    const filepath = resolve(projectRoot, 'data/poller-state.json')
    try {
      const data = await fs.readFile(filepath, { encoding: 'utf8' })
      logger.log('状态加载成功')
      return JSON.parse(data)
    } catch (err) {
      logger.error('加载状态失败:', err)
      throw new Error('加载状态失败')
    }
  }

  public async writeState(state: PollerState, logger: Logger, sourceRemark?: string): Promise<void> {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const projectRoot = await this.getProjectRoot()
    const filepath = path.resolve(projectRoot, 'data/poller-state.json')
    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true })
      await fs.writeFile(filepath, JSON.stringify(state, null, 2))
      logger.log(`状态保存成功${sourceRemark ? ': ' + sourceRemark : ''}`)
    } catch (err) {
      logger.error('保存状态失败:', err)
    }
  }
}
