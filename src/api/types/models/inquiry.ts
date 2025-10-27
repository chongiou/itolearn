export interface InquiryQuestionOption {
  /** 选项的唯一值，来自 input 的 value 属性 */
  value: string
  /** 选项的显示文本 */
  text: string
  checked: boolean
}

export interface InquiryQuestion {
  /** 问题的唯一ID，来自 li 的 data-content 属性 */
  id: string
  /** 问题的输入类型（radio/checkbox/...）*/
  inputType: 'radio' | 'checkbox' | 'unknown'
  /** 问题类型（例如：'单选'、'多选'，根据 inputType 映射） */
  type: string
  /** 问题的完整文本内容 */
  content: string
  /** 问题的选项列表 */
  options: InquiryQuestionOption[]
}

export interface InquiryData {
  /** 调查的主标题 */
  title: string
  /** 调查的描述或副标题 */
  description: string
  /** 问卷列表的 data-operator 属性 */
  operatorId?: string
  /** 问卷列表的 data-teacherId 属性 */
  teacherId?: string
  /** 问卷列表的 data-chid 属性 */
  chapterId?: string
  /** 问题的列表 */
  questions: InquiryQuestion[]
}
