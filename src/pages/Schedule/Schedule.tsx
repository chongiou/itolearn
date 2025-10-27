import type { Course, WeeklySchedule } from '@/api/types/models'

import style from './Schedule.module.css'
import Load from '@/components/Load'
import { getSchedule } from '@/api/services'
import { createSignal, Show, createEffect, untrack, createMemo } from 'solid-js'
import ScrollableContainer from '@/components/ScrollableContainer'
import { A } from '@solidjs/router'
import * as scheduleStore from '@/store/schedule'
import Button from '@/components/Button'
import { setBackgroundTask } from '@/layout/Titlebar'

export default function WeeklySchedule() {
  const [screenLoading, setScreenLoading] = createSignal(false)

  async function refreshSchedule(week: number = 0, relative: boolean = false) {
    const scheduleData = untrack(() => scheduleStore.scheduleData())

    if (scheduleData == null) {
      console.log('首次加载, 显示加载动画')
      setScreenLoading(true)
    }

    const newData = await setBackgroundTask(async () => {
      return getSchedule(week, relative)
    })

    if (JSON.stringify(newData) !== JSON.stringify(scheduleData) || scheduleData == null) {
      scheduleStore.setScheduleData(() => newData)
      console.log('更新数据')
      setScreenLoading(false)
    } else {
      console.log('数据没有变化, 不更新')
      setScreenLoading(false)
    }
  }

  createEffect(() => {
    refreshSchedule(scheduleStore.week(), true)
  })

  return (
    <div class={style.page}>
      <div data-tauri-drag-region class={style.header}>
        <h1>课程表</h1>
        <div class={style.action}>
          <Button
            onClick={() => {
              scheduleStore.setWeek((w) => w - 1)
              setScreenLoading(true)
            }}
          >
            上周
          </Button>
          <Button
            onClick={() => {
              if (scheduleStore.week() === 0) {
                return
              }
              scheduleStore.setWeek(0)
              setScreenLoading(true)
            }}
          >
            本周
          </Button>
          <Button
            onClick={() => {
              scheduleStore.setWeek((w) => w + 1)
              setScreenLoading(true)
            }}
          >
            下周
          </Button>
          <Show when={scheduleStore.scheduleData()}>
            <p>你正在查看第{scheduleStore.scheduleData()!.semesterWeek}周的课程表</p>
          </Show>
        </div>
      </div>
      <ScrollableContainer>
        <Show
          when={!screenLoading() && scheduleStore.scheduleData()}
          fallback={<Load tip='正在加载课程表' />}
        >
          <Table />
        </Show>
      </ScrollableContainer>
    </div>
  )
}

function Table() {
  const schedule = createMemo(() => scheduleStore.scheduleData()?.weeklySchedule || [])

  // 预设标准时间段
  const STANDARD_SLOTS = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ]
  const timeSlots = STANDARD_SLOTS.map((slot) => slot.join('-'))

  const today = new Date()
  const adjustedMonth = today.getMonth() + 1

  const thOfMonth = schedule().map((schedule) => {
    const month = schedule.date.getMonth() + 1
    const date = schedule.date.getDate()
    return (
      <th class={date === today.getDate() ? style.today : ''}>
        {month !== adjustedMonth && `${month}/`}
        {date}号
      </th>
    )
  })
  const thOfWeek = schedule().map((schedule) => {
    return <th> {schedule.weekdayCN}</th>
  })

  // 渲染每一行（时间段）
  return (
    <table class={style.schedule}>
      <thead>
        <tr>
          <th>{adjustedMonth}月</th>
          {thOfMonth}
        </tr>
        <tr>
          <th>星期</th>
          {thOfWeek}
        </tr>
      </thead>
      <tbody>
        {timeSlots.map((slot) => (
          <tr>
            <td>
              <p style={{ margin: '5px' }}>{slot.split('-')[0]}</p>
              <p style={{ margin: 0, opacity: 0.1, 'font-size': '1.5rem' }}>-</p>
              <p style={{ margin: '5px' }}>{slot.split('-')[1]}</p>
            </td>
            {schedule().map((schedule) => {
              // 判断是否需要错位修正
              let courses: Course[] = []

              // 不修正，按原始 timeSlot 显示
              courses = schedule.courses.filter((c) => c.period?.join('-') === slot)

              if (courses.length > 1) {
                // 冲突课程
                return (
                  <td>
                    <div class='conflictCoursesContainer'>
                      {courses.map((course) => (
                        <CourseCell course={course} />
                      ))}
                    </div>
                  </td>
                )
              }
              if (courses.length === 1) {
                return (
                  <td>
                    <CourseCell course={courses[0]} />
                  </td>
                )
              }
              // 没有课程
              return <td></td>
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CourseCell({ course }: { course: Course }) {
  return (
    <div class={style.scheduleCellContainer + ' ' + style[course.status]}>
      <A href='/schedule/course' state={course}>
        <p>{course.name}</p>
        {/* <p style={{ 'font-size': '0.8em', opacity: 0.7 }}>{course.collegeAndClass}</p> */}
      </A>
    </div>
  )
}
