import { studyMaterial } from "@/api/adapters/homework/studyMaterial"
import { Homework } from "@/api/types/models"
import { showToast } from "@/components/Toast"
import { createResource, createSignal, For, Show } from "solid-js"
import style from './Homework.module.css'
import Loading from "@/components/Loading"
import { ScrollableContainer } from "@/components/ScrollableContainer"
import Button from "@/components/Button"
import Input from "@/components/Input"

interface Props {
  homework: Homework
}

export default function StudyMaterial({ homework }: Props) {
  const [commentContent, setCommentContent] = createSignal<string>('')
  const [commentListData] = createResource(() => {
    return studyMaterial.getComments(homework.courseElementId, 1, 5)
  })

  async function doStudyMateria(comment: string) {
    const commentResult = await studyMaterial.sendComment(homework.courseElementId, comment)
    showToast(`评论: ${commentResult.message}`, commentResult.success ? 'success' : 'error')
    const appreciationResult = await studyMaterial.appreciation('add', commentResult.commentId)
    showToast(`点赞: ${appreciationResult.message}`, appreciationResult.success ? 'success' : 'error')
  }

  return (
    <>
      <div class={style.sendCommentContainer}>
        <Input onInput={it => setCommentContent(it.target.value)} placeholder={`输入您的讨论主题或提出您的问题`} />
        <div class={style.button}>
          <Button
            onclick={async () => {
              if (commentContent()) {
                await doStudyMateria(commentContent())
              } else {
                showToast('请输入内容!', 'info')
              }
            }}
          >提交评论</Button>
          <Button
            onclick={async () => {
              await doStudyMateria('已阅读')
            }}>
            快捷发送 "已阅读"
          </Button>
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
