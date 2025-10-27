import { Homework, Course } from "@/api/types/models"
import { Modal } from "@/components/Modal"
import { useLocation, useNavigate } from "@solidjs/router"
import { Switch, Match, Show } from "solid-js"
import style from './Homework.module.css'
import StudyMaterial from "./StudyMaterial"
import SimpleQA from "./SimpleQA"
import Quiz from "./Quiz"
import Inquiry from "./Inquiry"

export default function HomeworkDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const { course, homework } = location.state as { course: Course, homework: Homework }

  return (
    <>
      <div class={style.header}>
        <h1>{homework.type}</h1>
        <Show when={
          homework.type !== '学习资料' &&
          homework.type !== '测验'
        }>
          <p>{homework.description}</p>
        </Show>
      </div>
      <Switch>
        <Match when={homework.type === '学习资料'}>
          <StudyMaterial homework={homework} />
        </Match>
        <Match when={homework.type === '一句话问答'}>
          <SimpleQA course={course} homework={homework} />
        </Match>
        <Match when={homework.type === '测验' || homework.type === '过关练习'}>
          <Quiz homework={homework} />
        </Match>
        <Match when={homework.type === '调查'}>
          <Inquiry course={course} homework={homework} />
        </Match>
        <Match when={true}>
          <Modal
            open={true}
            title={`不支持${homework.type}类型的作业`}
            content={`不支持${homework.type}类型的作业。请返回上一层。`}
            onPrimary={() => {
              navigate(-1)
            }} />
        </Match>
      </Switch>
    </>
  )
}
