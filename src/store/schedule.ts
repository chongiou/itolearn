import type { WeeklySchedule } from "@/api/types/models"
import { createSignal } from "solid-js"

export interface ScheduleData {
  semesterWeek: number
  weeklySchedule: WeeklySchedule
}

export const [week, setWeek] = createSignal(0)
export const [scheduleData, setScheduleData] = createSignal<ScheduleData | null>(null)
