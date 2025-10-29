import type { ScheduleDiffer } from "../utils/ScheduleDiffer"
import type { StateManager } from "../storage/StateManager"
import type { TimeHelper } from "../utils/TimeHelper"
import type { WeeklySchedule } from "../types"
import type { Events, TypedEventBus } from "./TypedEventBus"
import { type Logger } from "@/utils/logger"
import { DateTime } from "luxon"

export class SchedulePoller {
  private isRunning = false
  private timeoutId?: NodeJS.Timeout

  constructor(
    private eventBus: TypedEventBus,
    private stateManager: StateManager,
    private timeHelper: TimeHelper,
    private differ: ScheduleDiffer,
    private getWeeklySchedule: (week?: number, relative?: boolean) => Promise<{ semesterWeek: number; weeklySchedule: WeeklySchedule }>,
    private logger: Logger
  ) { }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.log("已在运行中")
      return
    }

    this.isRunning = true
    this.logger.log("启动课表轮询")

    // 第一次启动时立即执行一次轮询
    await this.poll()

    // 开始循环
    this.scheduleNext()
  }

  stop(): void {
    this.isRunning = false
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    this.logger.log("已停止课表轮询")
  }

  private scheduleNext(): void {
    if (!this.isRunning) return

    const nextTime = this.timeHelper.getNextPollTime()
    const delay = nextTime.diffNow().milliseconds

    this.logger.log(`课程表下次轮询时间: ${nextTime.toFormat("yyyy-MM-dd HH:mm:ss")}`)

    this.timeoutId = setTimeout(async () => {
      await this.poll()
      this.scheduleNext()
    }, delay)
  }

  private async poll(): Promise<void> {
    const dateType = this.timeHelper.getDateType()

    // 周末和节假日跳过
    if (dateType === "weekend" || dateType === "holiday") {
      this.logger.log(`${dateType} 跳过轮询`)
      return
    }

    this.logger.log(`开始轮询 (${dateType})`)

    try {
      let allSchedules: WeeklySchedule = []
      let semesterWeek: number

      if (dateType === "makeupWorkday") {
        // 补班日：获取本周+未来2周
        const [week0, week1, week2] = await Promise.all([
          this.getWeeklyScheduleWithRetry(0),
          this.getWeeklyScheduleWithRetry(1, true),
          this.getWeeklyScheduleWithRetry(2, true)
        ])

        allSchedules = [...week0.weeklySchedule, ...week1.weeklySchedule, ...week2.weeklySchedule]
        semesterWeek = week0.semesterWeek
        this.logger.log("补班日模式：已获取3周课表")
      }
      else {
        // 普通工作日：获取本周
        const result = await this.getWeeklyScheduleWithRetry(0)
        allSchedules = result.weeklySchedule
        semesterWeek = result.semesterWeek
      }

      // Diff
      const state = this.stateManager.getState()
      if (state.lastSchedulePoll && state.lastSchedulePoll.weeklySchedule) {
        const changes = this.differ.diff(state.lastSchedulePoll.weeklySchedule, allSchedules, this.timeHelper)

        for (const change of changes) {
          if (change.newStatus !== change.oldStatus) {
            this.logger.log(`课程状态变化: ${change.course.name} ${change.oldStatus} → ${change.newStatus}`)
            this.eventBus.emit('course:statusChanged', change)

            if (change.newStatus === 'ongoing') {
              this.eventBus.emit('course:classStart', change as Events['course:classStart'])
              this.scheduleClassEndedEvent(change)
            }
          }

          if (change.isMissed) {
            this.logger.warning(
              `\n发现错过的课程: ${change.course.name}\n` +
              `  课程时间: ${change.schedule.date} ${change.course.period}\n` +
              `  下课时间: ${change.actualEndTime.toFormat('HH:mm')}\n` +
              `  发现时间: ${change.discoveredAt.toFormat('HH:mm')}\n` +
              `  → 触发错过事件`
            )
            // 假设课后不会发布新作业, 因此该事件不被作业轮询器处理
            this.eventBus.emit('course:missed', change as Events['course:missed'])
          }
        }
      }

      // 保存状态
      this.stateManager.updateSchedulePoll({
        timestamp: Date.now(),
        semesterWeek,
        weeklySchedule: allSchedules
      })
      await this.stateManager.save('保存课程表状态')

      // 发出轮询完成事件
      this.eventBus.emit('schedule:polled', {
        weeklySchedule: allSchedules,
        semesterWeek,
        timestamp: Date.now()
      })

    } catch (err) {
      this.logger.error("轮询失败:", err)
      this.eventBus.emit('poller:error', {
        type: 'schedule',
        error: err as Error,
        retryCount: 0
      })
    }
  }

  private scheduleClassEndedEvent(change: Events['course:statusChanged']): void {
    const now = DateTime.now()
    const endTime = change.actualEndTime
    const delay = endTime.diff(now).milliseconds

    this.logger.log(`设置下课定时器: ${change.course.name} 将在 ${endTime.toFormat('HH:mm')} 下课`)

    setTimeout(() => {
      this.logger.log(`课程已下课: ${change.course.name}`)
      this.eventBus.emit('course:classEnded', {
        course: change.course,
        schedule: change.schedule,
        endTime: change.actualEndTime
      })
    }, delay)
  }

  private async getWeeklyScheduleWithRetry(
    week?: number,
    relative?: boolean,
    maxRetries: number = 5
  ): Promise<{ semesterWeek: number; weeklySchedule: WeeklySchedule }> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.getWeeklySchedule(week, relative)
      } catch (err) {
        const delay = Math.pow(2, i) * 1000
        this.logger.error(`获取课表失败 (${i + 1}/${maxRetries}), ${delay}ms 后重试...`)

        this.eventBus.emit('poller:error', {
          type: 'schedule',
          error: err as Error,
          retryCount: i + 1,
          context: { week, relative }
        })

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    throw new Error(`获取课表失败，已重试 ${maxRetries} 次`)
  }
}
