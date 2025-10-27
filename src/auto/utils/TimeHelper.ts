import { DateTime } from "luxon"
import type { Holiday, ClassTime, ISOString, DateType } from "../types"
import { OVERTIME_TOLERANCE } from "../config/classSchedule"

export class TimeHelper {
  constructor(
    private holidays: Holiday[],
    private classSchedule: ClassTime[]
  ) { }

  getDateType(date?: ISOString): DateType {
    date = date ?? DateTime.now().toISODate() as ISOString
    const target = DateTime.fromISO(date)

    for (const h of this.holidays) {
      const start = DateTime.fromISO(h.start)
      const end = DateTime.fromISO(h.end)
      if (target >= start && target <= end) {
        return "holiday"
      }
      if (h.workdays.includes(date)) {
        return "makeupWorkday"
      }
    }

    const weekday = target.weekday
    if (weekday === 6 || weekday === 7) {
      return "weekend"
    }

    return "workday"
  }

  getCurrentPeriod(): number | null {
    const now = DateTime.now()
    const currentTime = now.toFormat("HH:mm")

    for (const cls of this.classSchedule) {
      if (currentTime >= cls.start && currentTime <= cls.end) {
        return cls.period
      }
    }
    return null
  }

  getNextPollTime(): DateTime {
    const now = DateTime.now()
    const currentTime = now.toFormat("HH:mm")

    // 找到下一个课节开始时间
    for (const cls of this.classSchedule) {
      if (currentTime < cls.start) {
        return DateTime.fromFormat(cls.start, "HH:mm").set({
          year: now.year,
          month: now.month,
          day: now.day
        })
      }
    }

    // 如果今天所有课节都结束了，返回明天第一节课
    const tomorrow = now.plus({ days: 1 })
    return DateTime.fromFormat(this.classSchedule[0].start, "HH:mm").set({
      year: tomorrow.year,
      month: tomorrow.month,
      day: tomorrow.day
    })
  }

  isInClassTime(): boolean {
    return this.getCurrentPeriod() !== null
  }

  getCourseEndTime(period: [number, number], overtimeTolerance: number = OVERTIME_TOLERANCE, dt?: DateTime): DateTime {
    const endPeriod = period[1]
    const classTime = this.classSchedule.find(c => c.period === endPeriod)

    if (!classTime) {
      throw new Error(`无效的课节: ${endPeriod}`)
    }

    const targetDate = dt ? dt : DateTime.now()
    // 使用传入的日期，确保节假日模式也能正确计算课程结束时间
    return DateTime.fromFormat(classTime.end, "HH:mm")
      .set({ year: targetDate.year, month: targetDate.month, day: targetDate.day })
      .plus({ minutes: overtimeTolerance })
  }
}
