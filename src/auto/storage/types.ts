import type { WeeklySchedule, Course, DayPlan } from "@/auto/types"

export interface PollerState {
  lastSchedulePoll: {
    timestamp: number
    semesterWeek: number
    weeklySchedule: WeeklySchedule
  } | null

  activeHomeworkPollers: {
    [scheduleId: string]: {
      course: Course
      schedule: DayPlan
      startTime: number
      lastPollTime: number
      knownHomeworkIds: string[]
    }
  }
}
