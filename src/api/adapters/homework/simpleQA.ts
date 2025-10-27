// 一句话问答

import { getFileServerTokenWithCache } from ".."
import { itolearnClient } from "@/api/adapters"
import type { SimpleQACommentList } from "@/api/types/models"
import type { RawGetSimpleQACommentListResponse } from "@/api/types/_raw"

export async function sendSimpleQAComment(homeworkId: string, comment: string) {
  interface ApiResponse {
    success: number
    // cspell: disable-next-line
    apid: string
  }
  const resp = await itolearnClient.post<ApiResponse>('/webios/newAddAnd', {
    content: comment,
    icaID: homeworkId
  })
  return {
    // cspell: disable-next-line
    id: resp.data.apid,
    success: resp.data.success
  }
}

export async function getSimpleQACommentList(interactiveClassroomId: string, homeworkId: string) {
  const resp = await itolearnClient.get<RawGetSimpleQACommentListResponse>('/api/iCActivities', {
    params: {
      icid: interactiveClassroomId,
      taskIcaID: homeworkId
    },
    headers: {
      token: await getFileServerTokenWithCache(),
    }
  })
  return cleanSimpleQACommentList(resp.data)
}

function cleanSimpleQACommentList(rawData: RawGetSimpleQACommentListResponse): SimpleQACommentList {
  const rawDataPart = rawData.data

  const comments = rawDataPart.list.map(item => {
    const partakeData = item.partake

    return {
      commentId: partakeData.AP_ID,
      name: item.OperName,
      avatarId: item.OperImg,
      content: partakeData.AP_Result,
    }
  })

  return {
    type: 'simpleQA',
    subject: rawDataPart.Name,
    icaID: rawDataPart.icaID,
    comment: comments,
  }
}

export const simpleQA = {
  sendComment: sendSimpleQAComment,
  getComments: getSimpleQACommentList
}

export default simpleQA
