import type { ClassTime } from "../types"

export const classSchedule: ClassTime[] = [
  // 上午
  { period: 1, start: "08:40", end: "09:20" },
  { period: 2, start: "09:30", end: "10:10" },
  { period: 3, start: "10:30", end: "11:10" },
  { period: 4, start: "11:20", end: "12:00" },

  // 下午
  { period: 5, start: "14:30", end: "15:10" },
  { period: 6, start: "15:20", end: "16:00" },
  { period: 7, start: "16:10", end: "16:50" },
  { period: 8, start: "17:00", end: "17:40" },

  // 晚上
  { period: 9, start: "19:40", end: "20:20" },
  { period: 10, start: "20:30", end: "21:10" }
]

// 拖堂时间 分钟
export const OVERTIME_TOLERANCE = 5
