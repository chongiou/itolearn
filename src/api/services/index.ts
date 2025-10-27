import { getCurrentSemesterInfo, getScheduleRaw } from "@/api/adapters"
import { getHomework } from '@/api/adapters/homework'
import { HomeworkType, type Homework } from '@/api/types/models'
import { extractScheduleData, patchCourseData } from '@/api/adapters/utils'

export { authService } from './AuthService'
export { loginStateManager } from './LoginStateManager'


/**
 * @param week 学期周, 例如传递 3 取第 3 周的课表
 * @param relative 相对模式, 启用后将 `week` 视为相对周, 例如 -1 可以取上周的课表, 正数 1 取下周的课表
 * @remark 无论是绝对模式还是相对模式, 留空或传递 0 取本周
 * @returns 
*/
export async function getSchedule(week: number = 0, relative: boolean = false) {
  const semester = await getCurrentSemesterInfo()
  let targetWeek: number
  if (relative) {
    // week 为相对周数, 0 表示本周, 正数下周, 负数上周
    targetWeek = semester.week + week
  } else {
    // week 为绝对周数, 0 表示本周
    targetWeek = week === 0 ? semester.week : week
  }

  const html = await getScheduleRaw(semester.id, targetWeek)
  let schedule = await extractScheduleData(html)
  schedule = await patchCourseData(schedule)

  // 如果 schedule 一周的第 1-2 节课都没有课
  const isAllFirstPeriodEmpty = schedule.every(schedule => {
    return !schedule.courses.some(course => course.period.join() === '1,2')
  })

  if (isAllFirstPeriodEmpty) {
    for (const dayPlan of schedule) {
      for (const course of dayPlan.courses) {
        course.period = course.period.map(it => it - 1) as [number, number]
      }
    }
  }

  return {
    /**学期周 */
    semesterWeek: targetWeek,
    weeklySchedule: schedule
  }
}

export async function getCourseHomeworks(interactiveClassroomId: string, scheduleId: string, lessonId: string): Promise<Homework[]> {
  const fetchHomework = (type: HomeworkType) => {
    return getHomework(type, interactiveClassroomId, scheduleId, lessonId)
  }

  // 接口限流, 并且负优化, 串行比并行更快
  // const result = await Promise.all([
  //   fetchHomework(HomeworkType.PreClassWork),
  //   fetchHomework(HomeworkType.InClassWork),
  //   fetchHomework(HomeworkType.AfterClassWork),
  // ])
  // return result.flat()

  return [
    ... await fetchHomework(HomeworkType.PreClassWork),
    ... await fetchHomework(HomeworkType.InClassWork),
    ... await fetchHomework(HomeworkType.AfterClassWork),
  ]
}
