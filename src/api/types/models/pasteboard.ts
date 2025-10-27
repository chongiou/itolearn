// 粘贴板评论列表
export interface PasteboardCommentList {
  type: 'pasteboard'
  subject: string
  comment: {
    /**如果是null, 说明是匿名, 实际上粘贴板的评论默认就是匿名的 */
    name: null | string
    avatarId: null | string
    content: string
    boardId: string
    star: number
    media: {
      id: string
      type: string
    }[]
  }[]
}
