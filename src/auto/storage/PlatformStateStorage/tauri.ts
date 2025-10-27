import type { Logger } from '@/utils/logger'
import type { PollerState } from '../types'
import { StateStorage } from './interface'

/**
 * 保存到 User/AppData/app/
 */
export class TauriStateStorage implements StateStorage {
  public async readState(logger: Logger): Promise<PollerState> {
    const { BaseDirectory, readTextFile, exists } = await import('@tauri-apps/plugin-fs')
    const filepath = 'poller-state.json'

    const isFileExists = await exists(filepath, { baseDir: BaseDirectory.AppData })
    if (!isFileExists) {
      logger.warning('状态文件不存在, 使用初始值')
      return { lastSchedulePoll: null, activeHomeworkPollers: {} }
    }

    try {
      const data = await readTextFile(filepath, { baseDir: BaseDirectory.AppData })
      logger.log('状态加载成功')
      return JSON.parse(data)
    } catch (err) {
      logger.error('加载状态失败', err)
      throw new Error(String(err))
    }
  }

  public async writeState(
    state: PollerState,
    logger: Logger,
    sourceRemark: string = '',
  ): Promise<void> {
    const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    const filepath = 'poller-state.json'

    try {
      await writeTextFile(filepath, JSON.stringify(state, null, 2), {
        baseDir: BaseDirectory.AppData,
      })
      logger.log(`状态保存成功${sourceRemark ? ': ' + sourceRemark : ''}`)
    } catch (err) {
      logger.error('保存状态失败:', err)
    }
  }
}
