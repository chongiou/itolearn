import { createResource, Match, Switch, For, createSignal, Show } from "solid-js"
import inquiry from '@/api/adapters/homework/inquiry'
import type { Course, Homework } from "@/auto/types"
import Loading from "@/components/Loading"
import style from './Inquiry.module.css'
import Button from "@/components/Button"
import ScrollableContainer from "@/components/ScrollableContainer"
import { modal } from "@/components/Modal"

interface Props {
  course: Course
  homework: Homework
}

export default function Inquiry(props: Props) {
  const { homework, course } = props
  const isSubmitted = homework.submitted

  const [inquiryData] = createResource(() =>
    inquiry.getInquiry(
      course.interactiveClassroomId!,
      homework.courseElementId,
      course.scheduleId,
      course.lessonId!
    )
  )

  const [answers, setAnswers] = createSignal<Map<string, string[]>>(new Map())
  const [submitting, setSubmitting] = createSignal(false)

  const handleChange = (questionId: string, optionValue: string, isCheckbox: boolean) => {
    setAnswers(prev => {
      const map = new Map(prev)
      if (isCheckbox) {
        const current = map.get(questionId) || []
        map.set(questionId,
          current.includes(optionValue)
            ? current.filter(v => v !== optionValue)
            : [...current, optionValue]
        )
      } else {
        map.set(questionId, [optionValue])
      }
      return map
    })
  }

  const handleSubmit = async () => {
    const data = inquiryData()
    if (!data) return

    // 验证所有问题已回答
    const unanswered = data.questions.some(q => !answers().get(q.id)?.length)
    if (unanswered) {
      modal.alert('请回答所有问题')
      return
    }

    setSubmitting(true)

    // 提交所有答案
    const result = await inquiry.submitInquiry(
      data.chapterId!,
      data.teacherId!,
      data.operatorId!,
      data.questions.map(question => {
        return {
          questionId: question.id,
          optionIds: answers().get(question.id) ?? []
        }
      })
    )
    if (result.success) {
      modal.alert('提交成功', result.message)
    } else {
      modal.alert('提交失败', result.message)
    }

    setSubmitting(false)
  }

  return (
    <>
      <Switch>
        <Match when={inquiryData.loading}>
          <Loading />
        </Match>
        <Match when={inquiryData.error}>
          <div class={style.inquiryError}>
            <h3 class={style.inquiryErrorTitle}>加载问卷失败</h3>
            <code class={style.inquiryErrorCode}>{String(inquiryData.error)}</code>
          </div>
        </Match>
        <Match when={inquiryData()}>
          <div class={style.pageContainer}>
            <div class={style.header}>
              <Button
                class={style.submitButton}
                onClick={handleSubmit}
                disabled={submitting() || isSubmitted}
              >
                <Show when={isSubmitted} fallback={
                  submitting() ? '提交中...' : '提交'
                }>
                  已提交
                </Show>
              </Button>
            </div>
            <ScrollableContainer>
              <For each={inquiryData()!.questions}>
                {(question, index) => {
                  const isCheckbox = question.inputType === 'checkbox'
                  const currentAnswers = answers().get(question.id) ?? []

                  return (
                    <div class={style.questionContainer}>
                      <p class={style.questionTitle}>{`Q${index() + 1} [${question.type}]: ${question.content.split('）')[1]}`}</p>
                      <div class={style.optionGroup}>
                        <For each={question.options}>
                          {(option) => (
                            <label
                              class={style.optionLabel}
                            >
                              <input
                                class={style.optionInput}
                                type={question.inputType === 'unknown' ? 'radio' : question.inputType}
                                name={question.id}
                                value={option.value}
                                checked={isSubmitted ? option.checked : currentAnswers.includes(option.value)}
                                onInput={() => handleChange(question.id, option.value, isCheckbox)}
                                disabled={isSubmitted}
                              />
                              <p>{option.text}</p>
                            </label>
                          )}
                        </For>
                      </div>
                    </div>
                  )
                }}
              </For>
            </ScrollableContainer>
          </div>
        </Match>
      </Switch >
    </>
  )
}
