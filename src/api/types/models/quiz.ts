export interface QuizQuestion {
  // 题目ID
  questionId: string
  // 题目类型
  questionType: number
  // 题目类型
  questionTypeCN: "单选" | "多选" | "判断" | "未知类型"
  // 题干
  question: string
  // 解析(可能没有解析, 这处决于教师端的设置)
  answerOptionId: string[]
  // 已选选项ID
  options: QuizOption[]
  // 选项列表
  remark: string
}

export interface QuizOption {
  id: string
  text: string
}

export interface QuizData {
  chapterId: string
  questions: QuizQuestion[]
  startTime: Date | null
  endTime: Date | null
}

export interface QuizQuestionAnswer {
  questionId: string
  questionType: QuizQuestion["questionType"]
  answerOptions: string[]
}
