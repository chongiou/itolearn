export interface Holiday {
  name: string
  start: string
  end: string
  days: number
  workdays: string[]
}

export interface ClassTime {
  period: number
  start: string
  end: string
}

export type DateType = "holiday" | "makeupWorkday" | "weekend" | "workday"
export type ISOString = `${number}${number}${number}${number}-${number}${number}-${number}${number}` & { readonly __brand?: "ISOString" }

export type WeeklySchedule = Array<DayPlan>

export interface DayPlan {
  date: Date
  weekdayCN: string
  weekday: number
  courses: Course[]
}

export interface Course {
  period: [number, number]
  name: string
  collegeAndClass: string
  scheduleId: string
  interactiveClassroomId: null | string
  lessonId: null | string
  status: "notStarted" | "completed" | "ongoing" | "unknown"
}

export interface Homework {
  homeworkId: string
  courseElementId: string
  type: '学习资料' | '测验' | '点将' | '一句话问答' | '过关练习' | '调查' | '粘贴板'
  description: string
  submitted: boolean
  section?: '第一环节' | '有效课堂测验环节' | '课堂思政环节'
  of: '课前' | '课中' | '课后'
}
