// 一句话问答评论列表
export interface SimpleQACommentList {
  type: 'simpleQA'
  subject: string
  comment: {
    commentId: string
    name: string
    avatarId: string
    content: string
  }[],
  icaID: string
}
