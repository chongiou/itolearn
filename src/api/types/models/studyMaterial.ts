// 学习资料评论列表
export interface StudyMaterialCommentList {
  type: 'studyMaterial',
  comment: {
    id: string
    name: string
    avatarId: string
    content: string
    appreciation: {
      id: string,
      name: string,
      avatarId: string,
      commentContent: null | string
    }[]
  }[],
  page: number
}
