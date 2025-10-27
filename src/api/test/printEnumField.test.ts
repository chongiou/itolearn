import type { Course, Homework } from "@/api/types/models"
import { getCourseHomeworks, getSchedule } from "@/api/services"

const { weeklySchedule } = await getSchedule()

function isCourseStarted(course: Course): course is Course & { interactiveClassroomId: string; lessonId: string } {
  return course.status !== "notStarted"
}

/** 填补 {@link Homework.type | 作业类型} 字段 */
const data1 = new Set()

/** 填补 {@link Homework.of | 课中环节类型} 字段 */
const data2 = new Set()

for (const schedule of weeklySchedule) {
  for (const course of schedule.courses) {
    if (!isCourseStarted(course)) {
      continue
    }
    console.log(`${schedule.weekdayCN} ${course.name} ${course.status}`)
    const homeworks = await getCourseHomeworks(course.interactiveClassroomId, course.scheduleId, course.lessonId)
    homeworks.forEach(it => {
      data1.add(it.type)
      if (it.of === '课中') {
        data2.add(it.section)
      }
    })
  }
}

console.log(data1)
console.log(data2)
