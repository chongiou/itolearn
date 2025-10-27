import { useLocation, useNavigate } from "@solidjs/router"
import { Show, createSignal, For, Switch, Match, createResource } from "solid-js"
import { getCourseHomeworks } from "@/api/services"
import type { Course, Homework } from "@/api/types/models"
import style from './Course.module.css'
import ScrollableContainer from "@/components/ScrollableContainer"
import Loading from "@/components/Loading"
import { getCheckinCode, getCheckinStatus } from "@/api/adapters/course"
import Button from "@/components/Button"

function isCourseStarted(course: Course): course is Course & { interactiveClassroomId: string; lessonId: string } {
  return course.status !== "notStarted"
}

export default function Course() {
  const location = useLocation()
  const navigate = useNavigate()
  const course = location.state as Course

  // 作业类型和状态映射
  const HOMEWORK_STATUS = {
    submitted: {
      text: '已完成✅',
      style: { opacity: 0.5, color: undefined }
    },
    notSubmitted: {
      text: '未完成❌',
      style: { opacity: 1, color: 'red' }
    },
    noNeed: {
      text: '无需完成✅',
      style: { opacity: 0.5, color: undefined }
    }
  }

  const COURSE_STATUS = (() => {
    switch (course.status) {
      case 'completed': return '已关闭'
      case 'notStarted': return '未开始'
      case 'ongoing': return '进行中'
      case 'unknown': return '未知'
    }
  })()

  const [homeworkList, setHomeworkList] = createSignal<Homework[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string>()
  const [checkinStatus] = createResource(() => getCheckinStatus(course.interactiveClassroomId!))
  const [checkinCode] = createResource(
    () => checkinStatus(),
    async (checkinStatus) => {
      if (course.status === 'completed') {
        return '无法取得签到码, 因为课程已关闭'
      }
      return getCheckinCode(checkinStatus.checkId)
    }
  )

  function getHomeworkStatus(homework: Homework) {
    if (homework.submitted) return HOMEWORK_STATUS.submitted
    if (homework.type === '点将') return HOMEWORK_STATUS.noNeed
    return HOMEWORK_STATUS.notSubmitted
  }

  async function fetchHomeworks() {
    if (!course) return
    setLoading(true)
    setError()
    try {
      if (isCourseStarted(course)) {
        const result = await getCourseHomeworks(course.interactiveClassroomId, course.scheduleId, course.lessonId)
        setHomeworkList(result)
      }
    } catch (e: any) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (course) fetchHomeworks()

  return (
    <>
      <div class={style.header}>
        <h1>{course.name}</h1>
        <div class={style.infoContainer}>
          <p>课程状态：{COURSE_STATUS}</p>
        </div>
        <div class={style.infoContainer}>
          <p>已完成作业：</p>
          <Show when={!loading() && !error()} fallback={<Loading />}>
            <p>{homeworkList().reduce((pre, cur) => pre + Number(cur.submitted), 0)}/{homeworkList().length}</p>
          </Show>
        </div>
        <div class={style.infoContainer}>
          <p>签到状态：</p>
          <Show when={checkinStatus()} fallback={<Loading />}>
            <p>{checkinStatus()?.isCheckin ? '已签到' : '未签到'}</p>
          </Show>
        </div>
        <div class={style.infoContainer}>
          <p>签到码：</p>
          <Show when={checkinCode()} fallback={<Loading />}>
            <p style={{ "user-select": 'text' }}>{checkinCode()}</p>
          </Show>
        </div>
      </div>
      <p>作业</p>
      <ScrollableContainer>
        <Switch>

          <Match when={loading()}>
            <Loading />
          </Match>

          <Match when={error()}>
            <div style={{ color: 'red' }}>{error()}</div>
          </Match>

          <Match when={!loading() && !error()}>
            <For each={homeworkList()}>
              {(homework) => {
                const status = getHomeworkStatus(homework)
                return (
                  <div class={style.homeworkItem}>
                    <h3>{homework.type}</h3>
                    <p>{homework.description}</p>
                    <p style={status.style}>{status.text}</p>
                    <Button onclick={() => {
                      navigate('/schedule/course/homework', { state: { course, homework } })
                    }}>详情</Button>

                  </div>
                )
              }}
            </For>
            <Show when={homeworkList().length === 0}>
              <div>没有作业</div>
            </Show>
          </Match>

        </Switch>
      </ScrollableContainer>
    </>
  )
}
