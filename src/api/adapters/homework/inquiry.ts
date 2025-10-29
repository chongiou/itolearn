// 调查

import { parseHTML, HTMLElement } from 'linkedom'
import { itolearnClient } from '@/api/adapters'
import type { InquiryData, InquiryQuestionOption, InquiryQuestion } from '@/api/types/models'

export async function getInquiry(interactiveClassroomId: string, courseElementId: string, scheduleId: string, lessionId: string): Promise<InquiryData> {
  const resp = await itolearnClient.get<string>('webios/survey', {
    params: {
      _rand_: new Date().toLocaleString(), // 可能是冗余字段
      scheduleid: scheduleId,
      lessionid: lessionId,
      icid: interactiveClassroomId,
      courseElementId,
      type: 0, // 可能是冗余字段
      // cspell: disable-next-line
      viewName: '~/Views/Weixin/inquriy.cshtml'
    }
  })
  return cleanInquiryData(resp.data)
}

function mapInputTypeToChinese(type: string): string {
  switch (type) {
    case 'radio':
      return '单选'
    case 'checkbox':
      return '多选'
    default:
      return '未知类型'
  }
}

function cleanInquiryData(htmlText: string): InquiryData {
  const { document } = parseHTML(htmlText)
  const title = document.querySelector('.c-top.inquiry h2')?.textContent?.trim() ?? '⚠️: 未找到标题'
  const description = document.querySelector('.c-top.inquiry p')?.textContent?.trim() ?? '⚠️: 未找到描述'

  const inquiryList = document.querySelector('#inquiryList') as HTMLElement | null
  // NOTE: 无法使用 dataset , 因为 html 中的自定义属性名不符合规范和非标准, linkdom无法处理这种边界情况
  const teacherId = inquiryList?.getAttribute('data-teacherId')
  const operatorId = inquiryList?.getAttribute('data-operator')
  const chapterId = inquiryList?.getAttribute('data-chid')

  const questions: InquiryQuestion[] = []
  const questionItems = inquiryList?.querySelectorAll('li') ?? []

  // 遍历所有问题
  for (const li of questionItems) {
    const questionId = li.getAttribute('data-content') ?? ''
    const h4 = li.querySelector('h4')
    const h4Text = h4?.textContent?.trim() ?? '⚠️: 未找到问题内容'

    // 提取第一个 input 的 type 来确定问题类型
    const firstInput = li.querySelector('input')
    const inputType: 'radio' | 'checkbox' | 'unknown' = (firstInput?.getAttribute('type') === 'radio' ? 'radio' : firstInput?.getAttribute('type') === 'checkbox' ? 'checkbox' : 'unknown')

    const questionType = mapInputTypeToChinese(inputType)

    const options: InquiryQuestionOption[] = []

    // 遍历当前问题下的所有选项
    const optionContainers = li.querySelectorAll('.mui-input-row')

    for (const container of optionContainers) {
      const input = container.querySelector('input')
      const label = container.querySelector('label')

      if (input && label) {
        const optionValue = input.getAttribute('value') ?? ''
        const optionText = label.textContent?.trim() ?? ''
        const checked = input.hasAttribute('checked')

        if (optionValue && optionText) {
          options.push({
            value: optionValue,
            text: optionText,
            checked: checked,
          })
        }
      }
    }

    if (questionId) {
      questions.push({
        id: questionId,
        inputType: inputType,
        type: questionType,
        content: h4Text,
        options: options,
      })
    }
  }

  return {
    title,
    description,
    operatorId,
    teacherId,
    chapterId,
    questions,
  }
}

export async function submitInquiry(
  chapterId: string,
  teacherId: string,
  operatorId: string,
  answers: {
    questionId: string,
    optionIds: string[]
  }[]
) {
  const requestBody: Record<string, any> = {
    CH_ID: chapterId
  }

  answers.forEach((answer, answerIndex) => {
    requestBody[`homeWork[${answerIndex}].TaskContent_ID`] = answer.questionId
    requestBody[`homeWork[${answerIndex}].CH_ID`] = chapterId
    requestBody[`homeWork[${answerIndex}].Operator_ID`] = teacherId
    requestBody[`homeWork[${answerIndex}].T_S_Operator_ID`] = operatorId

    answer.optionIds.forEach((optionId, optionIndex) => {
      requestBody[`homeWork[${answerIndex}].homeList[${optionIndex}].Value`] = optionId
    })
  })

  const resp = await itolearnClient.post('/webios/SubmitSurvey', new URLSearchParams(requestBody))
  return {
    success: !!resp.data.status || resp.data.message === '提交成功！！', // TODO: 不知道为啥提交成功, 但 status 是 0, 有待观察
    message: resp.data.message as string
  }
}

export const inquiry = {
  getInquiry,
  submitInquiry,
}

export default inquiry
