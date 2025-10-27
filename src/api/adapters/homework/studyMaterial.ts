// 学习资料

import { itolearnClient } from "@/api/adapters"
import type { StudyMaterialCommentList } from "@/api/types/models"
import type { api, Appreciation } from "@/api/types/_raw/studyMaterial"

/**
 * 获取学习资料的评论列表
 * @param courseElementId 作业ID
 * @param page 页
 * @param pageSize 分页
 * @returns 
 */
export async function getStudyMaterialCommentList(courseElementId: string, page: number, pageSize: number): Promise<StudyMaterialCommentList> {
  const resp = await itolearnClient.get<api['/getDiscussionContent']>('/Weixin/getDiscussionContent', {
    params: { id: courseElementId, page, pageSize }
  })
  const transformAppreciations = (appreciations: Appreciation[]): StudyMaterialCommentList['comment'][number]['appreciation'] => {
    return appreciations.map(like => ({
      id: like.OperID,
      name: like.OperName,
      avatarId: like.OperImgID,
      commentContent: like.DiscussionContent,
    }))
  }
  const transformComment = (comments: api['/getDiscussionContent']['list']): StudyMaterialCommentList['comment'] => {
    return comments.map(comment => ({
      id: comment.DiscussionContent.DC_ID,
      name: comment.OperName,
      avatarId: comment.OperImgID,
      content: comment.DiscussionContent.DC_Content,
      appreciation: transformAppreciations(comment.Appreciation),
    }))
  }
  return {
    type: 'studyMaterial',
    comment: transformComment(resp.data.list),
    page: resp.data.page
  }
}

/**
 * 添加或取消赞
 * @param type 
 * @param commentId 
 */
export async function submitAppreciation(type: 'add' | 'cancel', commentId: StudyMaterialCommentList['comment'][number]['id']) {
  // cspell: disable-next-line
  const resp = await itolearnClient.post('/webios/addAppreciation', {
    // cspell: disable-next-line
    dcid: commentId, ica_type: 5, type: type === 'add' ? 1 : 0
  })
  return {
    success: resp.data.success,
    message: resp.data.msg,
  }
}

/**
 * 发送评论到学习资料的评论区
 * @param courseElementId 
 * @param content 
 * @returns 
 */
export async function submitStudyMaterialComment(courseElementId: string, content: string) {
  // cspell: disable-next-line
  const resp = await itolearnClient.post<api['/webios/addComment']>('/webios/addComment', { id: courseElementId, content, Type: 2 })
  return {
    success: resp.data.success,
    // cspell: disable-next-line
    commentId: resp.data.dcid,
    message: resp.data.msg,
  }
}

/**
 * 追加评论到学习资料的评论区的评论
 * @param commentId 
 * @param content 
 * @returns 
 */
export async function submitStudyMaterialAppreciationComment(commentId: StudyMaterialCommentList['comment'][number]['id'], content: string) {
  // 和上面那个冗余了, 不管了
  // cspell: disable-next-line
  const resp = await itolearnClient.post<api['/webios/addComment']>('/webios/addComment', { id: commentId, content, Type: 1 })
  return {
    success: resp.data.success,
    // cspell: disable-next-line
    commentId: resp.data.dcid
  }
}

export const studyMaterial = {
  getComments: getStudyMaterialCommentList,
  appreciation: submitAppreciation,
  sendComment: submitStudyMaterialComment,
  appendComment: submitStudyMaterialAppreciationComment
}

export default studyMaterial
