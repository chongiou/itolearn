import { createResource, For, Show, createSignal, createEffect, createMemo } from "solid-js"
import { Homework } from "@/api/types/models"
import { quiz } from '@/api/adapters/homework/quiz'
import { ScrollableContainer } from "@/components/ScrollableContainer"
import Button from "@/components/Button"
import quizStyle from './Quiz.module.css'

interface Props {
  homework: Homework
}

function cleanQuestionText(htmlContent: string | null | undefined): string {
  if (!htmlContent) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, "text/html")
  return doc.body.textContent?.trim() || ''
}

// TODO: 需要重新实现这两个函数 (长期存储, 因为 tauri webview 的 user profile 是临时的)
// 保存临时答案到本地
function saveTempAnswers(courseElementId: string, answers: Record<string, string[]>): void {
  // localStorage.setItem(`quiz_${courseElementId}`, JSON.stringify(answers))
  console.log('保存临时答案:', courseElementId, answers)
}

// 从本地读取临时答案
function getTempAnswers(_courseElementId: string): Record<string, string[]> | null {
  // const saved = localStorage.getItem(`quiz_${courseElementId}`)
  // return saved ? JSON.parse(saved) : null
  return null
}

export default function Quiz(props: Props) {
  const { homework } = props

  // 获取题目列表
  const [quizQuestionList] = createResource(async () => {
    const res = await quiz.getQuestions(homework.courseElementId)
    res.questions = res.questions.map(question => ({
      ...question,
      question: cleanQuestionText(question.question),
      options: question.options.map(option => ({
        id: option.id,
        text: cleanQuestionText(option.text)
      }))
    }))
    return res
  })

  const [answers, setAnswers] = createSignal<Record<string, string[]>>({})

  // 初始化答案（从服务器或本地读取）
  createEffect(() => {
    const data = quizQuestionList()
    if (!data) return

    const initialAnswers: Record<string, string[]> = {}

    // 优先使用服务器返回的正式答案
    data.questions.forEach(question => {
      if (question.answerOptionId && question.answerOptionId.length > 0) {
        initialAnswers[question.questionId] = question.answerOptionId as string[]
      }
    })

    // 如果没有正式答案，尝试读取本地暂存
    const hasServerAnswers = Object.keys(initialAnswers).length > 0
    if (!hasServerAnswers) {
      const tempAnswers = getTempAnswers(homework.courseElementId)
      if (tempAnswers) {
        Object.assign(initialAnswers, tempAnswers)
      }
    }

    // 如果有任何答案，就设置
    if (Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers)
    }
  })

  // 自动保存：每次答案变化时保存到本地
  createEffect(() => {
    const currentAnswers = answers()
    if (Object.keys(currentAnswers).length > 0) {
      saveTempAnswers(homework.courseElementId, currentAnswers)
    }
  })

  // 计算已回答的题目数量
  const answeredCount = createMemo(() => {
    return Object.keys(answers()).length
  })

  const totalCount = createMemo(() => {
    return quizQuestionList()?.questions.length || 0
  })

  // 选项点击处理
  const handleOptionClick = (questionId: string, questionType: number, optionId: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || []

      // 单选/判断：直接替换
      if (questionType === 1 || questionType === 2) {
        return { ...prev, [questionId]: [optionId] }
      }

      // 多选：切换选中状态
      if (questionType === 3) {
        const isSelected = current.includes(optionId)
        const next = isSelected
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
        return { ...prev, [questionId]: next }
      }

      return prev
    })
  }

  // 提交全部答案
  const handleSubmit = async () => {
    const list = quizQuestionList()?.questions || []
    const allAnswers = Object.entries(answers()).map(([qid, arr]) => {
      const q = list.find(q => q.questionId === qid)
      return {
        questionId: qid,
        questionType: q?.questionType || 1,
        answerOptions: arr
      }
    })

    const res = await quiz.submitQuestion(homework.courseElementId, allAnswers)
    alert(res.message || (res.success ? '提交成功' : '提交失败'))
  }

  // 检查选项是否被选中
  const isChecked = (questionId: string, optionId: string) => {
    return (answers()[questionId] || []).includes(optionId)
  }

  return (
    <>
      <Show when={quizQuestionList.loading}>
        <div>加载中...</div>
      </Show>

      <Show when={quizQuestionList.error}>
        <div>加载失败</div>
      </Show>

      <Show when={quizQuestionList()}>
        <div class={quizStyle.quizContainer}>
          <div class={quizStyle.header}>
            <p>已回答 {answeredCount()}/{totalCount()} 个题目</p>
            <p>状态：{homework.submitted ? '已提交' : '未提交'}</p>
            <Show when={!homework.submitted}>
              <Button onClick={handleSubmit}>提交</Button>
            </Show>
          </div>

          <ScrollableContainer>
            <For each={quizQuestionList()!.questions}>
              {(question, index) => (
                <div class={quizStyle.questionContainer}>
                  <p class={quizStyle.questionTitle}>{`Q${index() + 1} [${question.questionTypeCN}]: ${question.question}`}</p>

                  <div class={quizStyle.optionGroup}>
                    <For each={question.options}>
                      {(option) => (
                        <label
                          classList={{
                            [quizStyle.checked]: isChecked(question.questionId, option.id)
                          }}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).tagName === 'INPUT') {
                              return
                            }
                            e.preventDefault()
                            if (homework.submitted) {
                              return
                            }
                            handleOptionClick(question.questionId, question.questionType, option.id)
                          }}
                        >
                          <input
                            type={question.questionType === 3 ? "checkbox" : "radio"}
                            checked={isChecked(question.questionId, option.id)}
                            readOnly
                            disabled={homework.submitted}
                          />
                          <p>{option.text}</p>
                        </label>
                      )}
                    </For>
                  </div>

                  <Show when={question.remark}>
                    <div class={quizStyle.remark}>解析: {question.remark}</div>
                  </Show>
                </div>
              )}
            </For>
          </ScrollableContainer>
        </div>
      </Show>
    </>
  )
}
