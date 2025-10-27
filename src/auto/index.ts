import { getSchedule, getCourseHomeworks } from '@/api/services'
import { HomeworkPoller } from './core/HomeworkPoller'
import { SchedulePoller } from './core/SchedulePoller'
import { ScheduleDiffer } from './utils/ScheduleDiffer'
import { StateManager } from './storage/StateManager'
import { TimeHelper } from './utils/TimeHelper'
import { TypedEventBus } from './core/TypedEventBus'
import { classSchedule } from './config/classSchedule'
import { holidays } from './config/holidays'
import { IS_NODE, IS_TAURI } from '@/env'
import { logger } from '@/auto/utils/logger'
import { AutoCheckinPlugin } from './plugins/autoCheckin'
import { AutoHomeworkPlugin } from './plugins/autoHomework'

export interface Plugin {
  name: string
  description?: string
  install: (eventBus: TypedEventBus) => Promise<void>
}

export class ItolearnAutomate {
  private shuttingDown: boolean = false
  private stopEventListener: (() => Promise<void>) | null = null
  private plugins: Plugin[] = [new AutoCheckinPlugin(), new AutoHomeworkPlugin()]

  public setEventListenerForLogOutput(fn: (message: string[]) => void) {
    logger.setLogOutputEventListener(fn)
  }

  public async createPoller() {
    const stateManager = new StateManager()
    const eventBus = new TypedEventBus()
    const timeHelper = new TimeHelper(holidays, classSchedule)
    const differ = new ScheduleDiffer()

    const schedulePoller = new SchedulePoller(eventBus, stateManager, timeHelper, differ, getSchedule)

    const homeworkPoller = new HomeworkPoller(eventBus, stateManager, timeHelper, getCourseHomeworks)

    const stopPoller = async () => {
      logger.log('正在关闭...')
      schedulePoller.stop()
      homeworkPoller.stop()
      await stateManager.save('保存最后状态')
    }

    const startPoller = async () => {
      await schedulePoller.start()
      return stopPoller
    }

    if (IS_NODE) {
      process.on('SIGINT', async () => {
        await stopPoller()
        process.exit(0)
      })
    }

    if (IS_TAURI) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const appWindow = getCurrentWindow()
      appWindow.onCloseRequested(async (event) => {
        if (this.shuttingDown) return

        event.preventDefault()
        this.shuttingDown = true

        await stopPoller().then(() => {
          appWindow.close()
        })
      })
    }

    return {
      stopPoller,
      startPoller,
      eventBus,
      schedulePoller,
      homeworkPoller,
      stateManager,
    }
  }

  public async registerPlugins(...plugins: Plugin[]) {
    this.plugins.push(...plugins)
  }

  private async installPlugins(eventBus: TypedEventBus) {
    await Promise.all(
      this.plugins.map((plugin) => {
        logger.log(`安装插件: ${plugin.name}`)
        plugin.install(eventBus)
      }),
    )
  }

  public async start() {
    const { eventBus, startPoller, stopPoller } = await this.createPoller()

    await startPoller()
    this.stopEventListener = stopPoller
    await this.installPlugins(eventBus)
  }

  public async stop() {
    if (this.stopEventListener) {
      await this.stopEventListener()
      this.stopEventListener = null
    }
  }

  public isAutomateRunning(): boolean {
    return this.stopEventListener !== null
  }
}
