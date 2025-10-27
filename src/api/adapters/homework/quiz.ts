// 课堂测试

import { cache, parseDotNetDate } from "@/utils"
import { itolearnClient } from "@/api/adapters"
import type { RawGetChapterIdResponse, RawGetQuizQuestionsResponse } from "@/api/types/_raw"
import type { QuizData, QuizQuestion, QuizQuestionAnswer, QuizOption } from "@/api/types/models/quiz"

async function getChapterId(courseElementId: string) {
  const resp = await itolearnClient.post<RawGetChapterIdResponse>("/webios/partStudentTestByCHID", {
    // cspell: disable-next-line
    courseElmentId: courseElementId,
  })
  return resp.data.CH_ID
}

const getChapterIdWithCache = cache(getChapterId, 1000 * 60 * 60 * 24)

export async function getQuizQuestions(courseElementId: string) {
  const chapterId = await getChapterIdWithCache(courseElementId)
  const resp = await itolearnClient.post<RawGetQuizQuestionsResponse>(
    "/webios/getTestQuestionList",
    {
      CH_ID: chapterId,
    }
  )
  const result = cleanQuizQuestions(resp.data)
  return result
}

function mapQuestionBankTypeToChinese(type: number) {
  switch (type) {
    case 1:
      return "单选"
    case 2:
      return "判断"
    case 3:
      return "多选"
    default:
      return "未知类型"
  }
}

function cleanQuizQuestions(rawData: RawGetQuizQuestionsResponse): QuizData {
  const chapterId = rawData.test.CH_ID
  const startTime = parseDotNetDate(rawData.test.CH_Start)
  const endTime = parseDotNetDate(rawData.test.CH_End)

  const questions: QuizQuestion[] = rawData.list.map((rawQuestion) => {
    // 题目选项
    const options: QuizOption[] = rawQuestion.QPerContent.map((rawOption) => ({
      id: rawOption.ID,
      text: rawOption.Content,
    }))

    const questionType = mapQuestionBankTypeToChinese(rawQuestion.QB_Type)

    // 用户回答
    const answerOptionId = rawQuestion.AnswerList.map((it) => it.Value)

    // 问题对象
    return {
      questionId: rawQuestion.TaskContent_ID,
      questionType: rawQuestion.QB_Type,
      questionTypeCN: questionType,
      question: rawQuestion.QB_Content,
      remark: rawQuestion.QB_Remark,
      answerOptionId: answerOptionId,
      options: options,
    }
  })

  return {
    chapterId,
    questions,
    startTime,
    endTime,
  }
}

export async function submitQuizAnswer(courseElementId: string, answers: QuizQuestionAnswer[]) {
  const chId = await getChapterIdWithCache(courseElementId)
  interface ApiResponse {
    code: number
    msg: string
    ver: string
    data: null
  }
  const resp = await itolearnClient.post<ApiResponse>("/webios/StudentSubmitAssignment", {
    CH_ID: chId,
    SubmitCHes: answers.map((it) => {
      return {
        content: it.answerOptions.toString(),
        QB_Type: it.questionType,
        taskContent_ID: it.questionId,
      }
    }),
  })
  return {
    success: !!resp.data.code,
    message: resp.data.msg,
  }
}

export const quiz = {
  /**取得题目和选项列表 */
  getQuestions: getQuizQuestions,
  /**提交答案 */
  submitQuestion: submitQuizAnswer,
}

export default quiz
