import { WEEK_MAP } from '../../adapters/utils'

export * from './inquiry'
export * from './quiz'
export * from './simpleQA'
export * from './studyMaterial'
export * from './pasteboard'

export type WeeklySchedule = Array<DayPlan>

export interface DayPlan {
  date: Date
  // 星期, 例如 "周一"
  weekdayCN: keyof typeof WEEK_MAP
  // 星期, 1-7
  weekday: number
  // 当天课程
  courses: Course[]
}

export interface Course {
  // 时间段(节) 比如 1-2 3-4, 一般是连堂的
  period: [number, number]
  // 课程名称
  name: string
  // 所属二级院校以及班级
  collegeAndClass: string
  // 日程id
  scheduleId: string,
  // 交互课堂id
  interactiveClassroomId: null | string,
  // 作业id
  lessonId: null | string
  // 课程状态
  status: "notStarted" | "completed" | "ongoing" | "unknown"
}

export interface Homework {
  homeworkId: string
  // 这个用来取测验题干, 算是冗余数据, 是历史遗留问题, 毕竟学校的线上课堂系统很老了
  courseElementId: string
  type: '学习资料' | '测验' | '点将' | '一句话问答' | '过关练习' | '调查' | '粘贴板'
  description: string
  submitted: boolean
  /**所属分块, 只有课中的作业才会有这个属性 */
  section?: '第一环节' | '有效课堂测验环节' | '课堂思政环节'
  /**所属时段 */
  of: '课前' | '课中' | '课后',
}

// TODO: 变量名可能不合适
export enum HomeworkType {
  PreClassWork = 1,
  InClassWork,
  AfterClassWork,
}
