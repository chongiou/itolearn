import { IS_NODE } from '@/env'
import type { WeeklySchedule, Course, DayPlan } from '../types/models'
import { getCheckinStatus, getCourseInfoFromScheduleId } from './course'

export const WEEK_MAP = {
  '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7
} as const

// TODO: 该检测方式不适用调休/补课/节假日
const seizeTheFuture = (date: number) => date > new Date().getDate()
const seizeTheFutureForWeek = (weekday: number) => weekday > new Date().getDay()

const extractAnchorElementData = async (anchorElement: Element) => {
  const url = anchorElement.getAttribute('href')!
  const name = anchorElement.querySelector('.info :first-child')?.textContent!
  const collegeAndClass = anchorElement.querySelector('.info :last-child')?.textContent!

  let interactiveClassroomId: null | string = null
  let lessonId: null | string = null
  let scheduleId: null | string = null

  if (url === 'javascript:;' || !url.startsWith('/')) {
    scheduleId = anchorElement.getAttribute('schedule_id')!
  } else {
    const res = Object.fromEntries(
      new URL(url, 'http://localhost').searchParams.entries()
    ) as { icid: string, lessionid: string, scheduleid: string }
    interactiveClassroomId = res.icid
    lessonId = res.lessionid
    scheduleId = res.scheduleid
  }

  const extractStatus = () => {
    // 如果课程在未来的时间, 那一定是未开课的 ... 该检测方式不适用调休
    // if (seizeTheFuture(date)) return 'notStarted'
    const status = anchorElement.className.split('_')[1]
    // 这个状态好像是根据作息表来的, 比如阶段 2-3 的课程, 9:20 就会变绿(状态2)
    if (interactiveClassroomId && status === '2') return 'ongoing'
    if (interactiveClassroomId && status === '4') return 'completed'
    if (interactiveClassroomId && status === '1') {
      // return 'notStarted'
      // NOTE: 1 也不一定是未开始...
      return 'unknown'
    }
    if (!interactiveClassroomId && status === 'no') {
      // NOTE: no 不一定是未开始, 有时候课程表信息会有延迟, 明明可以签到却是未开课的状态
      return 'unknown'
    }
    return 'unknown'
  }
  const status = extractStatus()

  return {
    name,
    collegeAndClass,
    interactiveClassroomId,
    scheduleId,
    lessonId,
    status: status as Course['status'],
  } satisfies Omit<Course, 'period'>
}

const mergeAdjacentCourse = (schedule: DayPlan): DayPlan => {
  const sorted = [...schedule.courses].sort(
    (a, b) => a.period[0] - b.period[0]
  )

  const merged: Course[] = []

  for (const course of sorted) {
    const last = merged[merged.length - 1]

    if (
      last &&
      last.name === course.name &&
      last.collegeAndClass === course.collegeAndClass &&
      last.interactiveClassroomId === course.interactiveClassroomId &&
      last.lessonId === course.lessonId &&
      // 占一个单元格
      last.period[0] === last.period[1] &&
      course.period[0] === course.period[1] &&
      // 单元格相邻
      last.period[1] + 1 === course.period[0]
    ) {
      last.period[1] = course.period[1]
    } else {
      merged.push({ ...course })
    }
  }

  return {
    ...schedule,
    courses: merged,
  }
}

export async function extractScheduleData(html: string) {
  let doc

  if (IS_NODE) {
    const { parseHTML } = await import('linkedom')
    doc = parseHTML(html).document
  } else {
    doc = new DOMParser().parseFromString(html, "text/html")
  }

  const table = doc.querySelector('table')!
  // 解析表头获取日期(列)信息
  const rows = Array.from(table.querySelectorAll('tr'))
  const theMonth = parseInt(rows[0].querySelector('th.date')!.textContent)
  const headerCells = rows[0].querySelectorAll('th.week')
  const weeklySchedule: WeeklySchedule = []
  let month = theMonth

  headerCells.forEach((th, index) => {
    const raw = th.textContent!.trim()
    const day = parseInt(raw)
    const weekName = raw.replace(day.toString(), '') as keyof typeof WEEK_MAP
    const today = new Date()
    const year = today.getFullYear()
    if (index !== 0 && day < weeklySchedule[index - 1].date.getDate()) {
      // 月份交界处, 月份推进1
      month += 1
    }
    weeklySchedule.push({
      date: new Date(`${year}-${month}-${day}`),
      weekdayCN: weekName,
      weekday: WEEK_MAP[weekName],
      courses: []
    })
  })

  // 从每行解析课程表数据
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) { // 跳过表头
    const row = rows[rowIndex]
    const cells = Array.from(row.querySelectorAll('td'))

    // 解析这一行的单元格
    for (let date = 0; date < cells.length; date++) {
      const cell = cells[date]

      if (!cell.textContent) {
        // 如果单元格没有内容, 则表示无课, 跳到下一个日期(单元格)
        continue
      }

      const timeSlotStart = rowIndex
      const timeSlotEnd = Number(cell.getAttribute('rowspan') ?? 1) - 1 + timeSlotStart
      const timeSlot = [timeSlotStart, timeSlotEnd] as [number, number]

      const conflictCourses = cell.querySelector('div.rommis')
      const anchors = conflictCourses ? conflictCourses.querySelectorAll('a') : [cell.querySelector('a[href]')!]

      for (const anchor of anchors) {
        const course = await extractAnchorElementData(anchor)
        weeklySchedule[date].courses.push({ ...course, period: timeSlot })
      }
    }
  }

  return weeklySchedule
}

// TODO: 缓存优化
export async function patchCourseData(weeklySchedule: WeeklySchedule): Promise<WeeklySchedule> {
  const task = []

  for (let date = 0; date < weeklySchedule.length; date++) {
    const schedule = mergeAdjacentCourse(weeklySchedule[date])

    for (let i = 0; i < schedule.courses.length; i++) {
      const course = schedule.courses[i]
      if (course.interactiveClassroomId && course.status === 'unknown') {
        task.push(
          getCheckinStatus(course.interactiveClassroomId).then(res => { // -> 这个接口也可以并发. 为什么加了这个接口之后, 总体用时变低了???
            const { canCheckin } = res
            if (canCheckin) {
              course.status = 'ongoing'
            } else {
              course.status = 'notStarted'
            }
          })
        )
      }
      if (!course.interactiveClassroomId) {
        task.push(
          getCourseInfoFromScheduleId(course.scheduleId).then(res => { // -> 这个接口没有限流, 可以并发
            course.interactiveClassroomId = res.interactiveClassroomId
            course.lessonId = res.lessonId
            if (course.interactiveClassroomId && course.status === 'unknown') {
              course.status = 'ongoing'
            } else {
              course.status = 'notStarted'
            }
            // console.log(`将${schedule.weekdayCN} ${course.name}修正为: ${course.status}`)
          })
        )
      }
      //
    }

    weeklySchedule[date] = schedule
  }

  await Promise.all(task)
  return weeklySchedule
}

