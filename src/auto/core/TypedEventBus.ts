import EventEmitter from "@/utils/EventEmitter"
import type { WeeklySchedule, Course, DayPlan, Homework } from "@/auto/types"
import type { DateTime } from "luxon"

export interface Events {
  'schedule:polled': {
    weeklySchedule: WeeklySchedule
    semesterWeek: number
    timestamp: number
  }
  'course:statusChanged': {
    course: Course
    oldStatus: Course['status']
    newStatus: Course['status']
    schedule: DayPlan
    isMissed: boolean
    actualEndTime: DateTime
    discoveredAt: DateTime
  }
  'course:missed': Events['course:statusChanged'] & {
    isMissed: true
  }
  'course:classStart': Events['course:statusChanged'] & {
    isMissed: false
  }
  'course:classEnded': {
    course: Course
    schedule: DayPlan
    endTime: DateTime
  }
  'homework:published': {
    homework: Homework
    course: Course
  }
  'poller:error': {
    type: 'schedule' | 'homework'
    error: Error
    retryCount: number
    context?: any
  }
}

export class TypedEventBus extends EventEmitter {
  emit<K extends keyof Events>(event: K, data: Events[K]): boolean {
    return super.emit(event, data)
  }

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): this {
    return super.on(event, listener)
  }

  once<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): this {
    return super.once(event, listener)
  }

  off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): this {
    return super.off(event, listener)
  }
}
