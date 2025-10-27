// lib
import { createResource, createSignal, For, Show } from "solid-js"

// api
import { Course, Homework } from "@/api/types/models"
import { debounce } from "@/utils/debounce"
import { simpleQA } from "@/api/adapters/homework/simpleQA"

// components
import { showToast } from "@/components/Toast"
import { ScrollableContainer } from "@/components/ScrollableContainer"

// style
import style from './Homework.module.css'
import Loading from "@/components/Loading"
import Button from "@/components/Button"
import Input from "@/components/Input"

interface Props {
  course: Course
  homework: Homework
}

export default function SimpleQA({ course, homework }: Props) {

  const [commentContent, setCommentContent] = createSignal<string>('')
  const [commentListData] = createResource(() => {
    return simpleQA.getComments(course.interactiveClassroomId!, homework.homeworkId)
  })

  return (
    <>
      <div class={style.sendCommentContainer}>
        <Input onInput={it => setCommentContent(it.target.value)} placeholder={`输入您的讨论主题或提出您的问题`} />
        <div class={style.button}>
          <Button
            onclick={debounce(async () => {
              if (commentContent()) {
                const commentResult = await simpleQA.sendComment(homework.homeworkId, commentContent())
                showToast(commentResult.success ? '发送成功' : '发送失败', commentResult.success ? 'success' : 'error')
              } else {
                showToast('请输入内容!')
              }
            })}
          >提交评论</Button>
        </div>
      </div>
      <h2>评论列表</h2>
      <Show when={commentListData()} fallback={
        <Loading />
      }>
        <ScrollableContainer>
          <div class={style.commentListContainer}>
            <For each={commentListData()?.comment}>
              {it => (
                <div class={style.commentContainer}>
                  <p class={style.username}>{it.name}</p>
                  <p class={style.content}>{it.content}</p>
                </div>
              )}
            </For>
          </div>
        </ScrollableContainer>
      </Show>
    </>
  )
}
