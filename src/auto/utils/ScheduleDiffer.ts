import { DateTime } from "luxon"
import type { WeeklySchedule } from "../types"
import type { Events } from "../core/TypedEventBus"
import type { TimeHelper } from "./TimeHelper"

export class ScheduleDiffer {
  diff(oldTable: WeeklySchedule, newTable: WeeklySchedule, timeHelper: TimeHelper): Events['course:statusChanged'][] {
    const changes: Events['course:statusChanged'][] = []

    for (const newSchedule of newTable) {
      const oldSchedule = oldTable.find(s =>
        DateTime.fromJSDate(s.date).toISODate() === DateTime.fromJSDate(newSchedule.date).toISODate()
      )

      if (!oldSchedule) continue

      for (const newCourse of newSchedule.courses) {
        const oldCourse = oldSchedule.courses.find(c => c.scheduleId === newCourse.scheduleId)
        const discoveredAt = DateTime.now()
        const actualEndTime = timeHelper.getCourseEndTime(
          newCourse.period,
          undefined,
          DateTime.fromJSDate(newSchedule.date),
        )

        if (oldCourse && oldCourse.status !== newCourse.status) {
          changes.push({
            course: newCourse,
            oldStatus: oldCourse.status,
            newStatus: newCourse.status,
            schedule: newSchedule,
            isMissed: discoveredAt > actualEndTime,
            actualEndTime,
            discoveredAt,
          })
        }
      }
    }

    return changes
  }
}
