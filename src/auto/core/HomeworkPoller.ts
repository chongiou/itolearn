import { DateTime } from "luxon"
import type { StateManager } from "../storage/StateManager"
import type { TimeHelper } from "../utils/TimeHelper"
import type { TypedEventBus, Events } from "./TypedEventBus"
import type { Homework, Course, DayPlan } from "../types"
import { logger, type Logger } from '@/auto/utils/logger'
import { truncateText } from "@/utils"

// 该轮询器是为了在课内尽快取得新作业, 适用于教师要求课内完成作业的情况
export class HomeworkPoller {
  private pollers: Map<string, NodeJS.Timeout> = new Map()
  private logger: Logger = logger.createChild('HomeworkPoller')

  constructor(
    private eventBus: TypedEventBus,
    private stateManager: StateManager,
    private timeHelper: TimeHelper,
    private getCourseHomeworks: (interactiveClassroomId: string, scheduleId: string, lessonId: string) => Promise<Homework[]>,
    private defaultPollInterval = 2 * 60 * 1000,
  ) {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // 监听课表轮询完成事件
    this.eventBus.on('schedule:polled', (data) => {
      this.handleSchedulePolled(data)
    })

    // 监听课程开始
    this.eventBus.on('course:classStart', (data) => {
      this.handleCourseClassStart(data)
    })
  }

  private handleSchedulePolled(data: Events['schedule:polled']): void {
    this.logger.log('处理课表轮询完成事件')
    // 检查是否有正在进行的课程
    for (const schedule of data.weeklySchedule) {
      for (const course of schedule.courses) {
        if (course.status === 'ongoing' && this.isCourseActuallyOngoing(schedule, course)&& !this.pollers.has(course.scheduleId)) {
          this.logger.log(`发现进行中的课程: ${course.name}`)
          this.startPolling(course, schedule)
        }
      }
    }
  }

  private handleCourseClassStart(data: Events['course:classStart']): void {
    this.logger.log('处理课程开始事件')
    const { course, newStatus, schedule } = data

    if (newStatus === 'ongoing') {
      this.startPolling(course, schedule)
    }
    else if (newStatus === 'completed') {
      this.stopPolling(course)
    }
  }

  private isCourseActuallyOngoing(schedule: DayPlan, course: Course): boolean {
    const now = DateTime.now()
    const endTime = this.timeHelper.getCourseEndTime(course.period, undefined, DateTime.fromJSDate(schedule.date))

    // 还没下课
    return now <= endTime
  }

  private startPolling(course: Course, schedule: DayPlan): void {
    if (!course.interactiveClassroomId || !course.lessonId) {
      this.logger.log(`课程 ${course.name} 缺少必要ID，跳过`)
      return
    }

    if (this.pollers.has(course.scheduleId)) {
      this.logger.log(`课程 ${course.name} 已在轮询中`)
      return
    }

    this.logger.log(`启动作业轮询: ${course.name} 直到 ${this.timeHelper.getCourseEndTime(course.period).toSQLTime()}`)

    // 立即执行一次
    this.pollHomework(course, schedule)

    // 设置定时器：每 defaultInterval 分钟轮询
    const intervalId = setInterval(() => {
      if (this.timeHelper.getCourseEndTime(course.period, undefined, DateTime.fromJSDate(schedule.date)) <= DateTime.now()) {
        this.logger.log(`课程 ${course.name} 已下课，停止轮询`)
        this.stopPolling(course)
        return
      }

      this.pollHomework(course, schedule)
    }, this.defaultPollInterval)

    this.pollers.set(course.scheduleId, intervalId)

    // 保存状态
    this.stateManager.setHomeworkPoller(course.scheduleId, {
      course,
      schedule,
      startTime: Date.now(),
      lastPollTime: Date.now(),
      knownHomeworkIds: []
    })
    this.stateManager.save('保存作业状态')
  }

  private stopPolling(course: Course): void {
    const intervalId = this.pollers.get(course.scheduleId)
    if (intervalId) {
      clearInterval(intervalId)
      this.pollers.delete(course.scheduleId)
      this.logger.log(`停止作业轮询: ${course.name} (${course.scheduleId})`)
    }

    this.stateManager.removeHomeworkPoller(course.scheduleId)
    this.stateManager.save('保存作业状态')
  }

  private async pollHomework(course: Course, _schedule: DayPlan): Promise<void> {
    if (!course.interactiveClassroomId || !course.lessonId) return

    try {
      const homeworks = await this.getCourseHomeworksWithRetry(
        course.interactiveClassroomId,
        course.scheduleId,
        course.lessonId
      )

      // 获取已知作业ID
      const pollerState = this.stateManager.getHomeworkPoller(course.scheduleId)
      const knownIds = new Set(pollerState?.knownHomeworkIds || [])

      // 检测新作业
      const newHomeworks = homeworks.filter(hw => !knownIds.has(hw.homeworkId))

      for (const homework of newHomeworks) {
        this.logger.log(`发现新作业: ${course.name} (${homework.type}: ${truncateText(homework.description, 9)})`)
        this.eventBus.emit('homework:published', { homework, course })
        knownIds.add(homework.homeworkId)
      }

      // 更新状态
      if (pollerState) {
        pollerState.knownHomeworkIds = Array.from(knownIds)
        pollerState.lastPollTime = Date.now()
        this.stateManager.setHomeworkPoller(course.scheduleId, pollerState)
        await this.stateManager.save('保存作业状态')
      }

    } catch (err) {
      this.logger.error(`轮询作业失败: ${course.name}`, err)
      this.eventBus.emit('poller:error', {
        type: 'homework',
        error: err as Error,
        retryCount: 0,
        context: { course }
      })
    }
  }

  private async getCourseHomeworksWithRetry(
    interactiveClassroomId: string,
    scheduleId: string,
    lessonId: string,
    maxRetries: number = 5
  ): Promise<Homework[]> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.getCourseHomeworks(interactiveClassroomId, scheduleId, lessonId)
      } catch (err) {
        const delay = Math.pow(2, i) * 1000
        this.logger.error(`获取作业失败 (${i + 1}/${maxRetries}), ${delay}ms 后重试...`)

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    throw new Error(`获取作业失败，已重试 ${maxRetries} 次`)
  }

  stop(): void {
    for (const [_scheduleId, intervalId] of this.pollers) {
      clearInterval(intervalId)
    }
    this.pollers.clear()
    this.logger.log("已停止作业轮询")
  }
}
