import { Plugin } from '@/auto'
import { TypedEventBus } from '../core/TypedEventBus'
import { type Logger } from '@/utils/logger'
import { Homework, Course } from '@/api/types/models'
import { studyMaterial } from '@/api/adapters/homework/studyMaterial'
import { simpleQA } from '@/api/adapters/homework/simpleQA'
import { inquiry } from '@/api/adapters/homework/inquiry'
import { truncateText } from '@/utils'

export class AutoHomeworkPlugin implements Plugin {
  name = '自动作业'
  logger!: Logger

  async handleHomework(homework: Homework, course: Course): Promise<void> {
    try {
      this.logger.log(`处理作业: <${course.name}> ${homework.type}(${truncateText(homework.description)})`)
      if (homework.submitted) {
        this.logger.log(`跳过该作业, 因为已提交`)
        return
      }

      switch (homework.type) {
        case '学习资料':
          await this.handleStudyMaterial(homework, course)
          break
        case '一句话问答':
          await this.handleSimpleQA(homework, course)
          break
        case '调查':
          await this.handleInquiry(homework, course)
          break
        case '点将':
          await this.handleRandomRollcall(homework, course)
          break
        case '测验':
          await this.handleQuiz(homework, course)
          break
        case '过关练习':
          await this.handleQuizExercises(homework, course)
          break
        case '粘贴板':
          await this.handlePasteboard(homework, course)
          break
        default:
          await this.handleUnknownTypeHomework(homework, course)
      }
    }
    catch (err) {
      this.logger.error(`处理作业失败: ${course.name} -> ${homework.type} (${truncateText(homework.description)})`, (err as Error).message)
      // TODO: 标记结果, 加入未完成队列
    }
  }

  private async handleStudyMaterial(homework: Homework, _course: Course): Promise<void> {
    // 处理规则: 发送"已阅读"评论和点赞自己消息
    const commentResult = await studyMaterial.sendComment(homework.courseElementId, '已阅读')

    if (commentResult.success && commentResult.commentId) {
      this.logger.success(`学习资料评论发送成功: ${commentResult.commentId}`)

      const appreciationResult = await studyMaterial.appreciation('add', commentResult.commentId)
      if (appreciationResult.success) {
        this.logger.success(`学习资料评论点赞成功`)
      } else {
        this.logger.warning(`学习资料评论点赞失败: ${appreciationResult.message}`)
      }
    } else {
      this.logger.error(`学习资料评论发送失败: ${commentResult.message}`)
    }
  }

  private async handleSimpleQA(homework: Homework, course: Course): Promise<void> {
    // 处理规则: 取得回答列表, 选择长度适中的答案
    // TODO: 可以先查看答案列表是否足够, 否则延迟完成

    const commentList = await simpleQA.getComments(course.interactiveClassroomId!, homework.homeworkId)

    if (commentList.comment.length === 0) {
      this.logger.error(`一句话问答暂无已回答内容，跳过`)
      // TODO: 标记结果, 加入未完成队列
      return
    }

    const bestAnswer = this.selectBestSimpleQAAnswer(commentList.comment)

    const result = await simpleQA.sendComment(homework.homeworkId, bestAnswer)

    if (result.success) {
      this.logger.success(`一句话问答提交成功: ${bestAnswer}`)
    } else {
      this.logger.error(`一句话问答提交失败`)
    }
  }

  private selectBestSimpleQAAnswer(comments: { content: string }[]): string {
    if (comments.length === 0) return '已学习'

    // 过滤掉太短或太长的答案
    const validAnswers = comments.filter(comment => {
      const content = comment.content.trim()
      return content.length >= 2 && content.length <= 100
    })

    if (validAnswers.length === 0) {
      // 如果没有合适的答案，返回第一个评论的内容
      return comments[0].content.trim() || '已学习'
    }

    // 选择长度最接近平均值的答案
    const avgLength = validAnswers.reduce((sum, comment) => sum + comment.content.length, 0) / validAnswers.length
    const bestAnswer = validAnswers.reduce((best, current) => {
      const bestDiff = Math.abs(best.content.length - avgLength)
      const currentDiff = Math.abs(current.content.length - avgLength)
      return currentDiff < bestDiff ? current : best
    })

    return bestAnswer.content.trim()
  }

  private async handleInquiry(homework: Homework, course: Course): Promise<void> {
    // 处理规则: 随机选择选项并提交

    const inquiryData = await inquiry.getInquiry(
      course.interactiveClassroomId!,
      homework.courseElementId,
      course.scheduleId,
      course.lessonId!
    )

    if (!inquiryData.operatorId || !inquiryData.teacherId || !inquiryData.chapterId) {
      this.logger.error(`调查数据不完整`)
      // TODO: 标记结果, 加入未完成队列
      return
    }

    // 生成随机答案
    const answers = inquiryData.questions.map(question => {
      const availableOptions = question.options.filter(option => !option.checked)

      if (availableOptions.length === 0) {
        // 如果没有可用选项，返回空数组
        return {
          questionId: question.id,
          optionIds: []
        }
      }

      if (question.inputType === 'radio') {
        // 单选：随机选择一个选项
        const randomIndex = Math.floor(Math.random() * availableOptions.length)
        return {
          questionId: question.id,
          optionIds: [availableOptions[randomIndex].value]
        }
      }
      else if (question.inputType === 'checkbox') {
        // 多选：随机选择1-3个选项
        const selectedCount = Math.min(Math.floor(Math.random() * 3) + 1, availableOptions.length)
        const shuffled = [...availableOptions].sort(() => 0.5 - Math.random())
        return {
          questionId: question.id,
          optionIds: shuffled.slice(0, selectedCount).map(option => option.value)
        }
      }
      else {
        // 未知类型，选择第一个选项
        return {
          questionId: question.id,
          optionIds: [availableOptions[0].value]
        }
      }
    })

    // 提交答案
    const result = await inquiry.submitInquiry(
      inquiryData.chapterId,
      inquiryData.teacherId,
      inquiryData.operatorId,
      answers
    )

    if (result.success) {
      this.logger.success(`调查提交成功`)
    } else {
      this.logger.error(`调查提交失败: ${result.message}`)
    }

  }

  private async handleRandomRollcall(homework: Homework, _course: Course) {
    this.logger.warning(`不处理点将作业: ${homework.description}`)
  }

  private async handleQuiz(homework: Homework, _course: Course) {
    this.logger.warning(`不处理测验作业: ${homework.description}`)
  }

  private async handleQuizExercises(homework: Homework, _course: Course) {
    this.logger.warning(`不处理过关练习作业: ${homework.description}`)
  }

  private async handlePasteboard(homework: Homework, _course: Course) {
    this.logger.warning(`不处理粘贴板作业: ${homework.description}`)
  }

  private async handleUnknownTypeHomework(homework: Homework, _course: Course) {
    this.logger.error(`未知的作业类型: ${homework.type} - ${homework.description}`)
  }

  async install(logger: Logger, eventBus: TypedEventBus) {
    this.logger = logger

    eventBus.on('homework:published', async (data) => {
      const { homework, course } = data
      await this.handleHomework(homework, course)
    })
  }
}
