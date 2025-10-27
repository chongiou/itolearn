import { Plugin } from '@/auto'
import { TypedEventBus } from '../core/TypedEventBus'
import { logger } from '@/auto/utils/logger'
import { Homework, Course } from '@/api/types/models'
import { studyMaterial } from '@/api/adapters/homework/studyMaterial'
import { simpleQA } from '@/api/adapters/homework/simpleQA'
import { inquiry } from '@/api/adapters/homework/inquiry'

export class AutoHomeworkPlugin implements Plugin {
  name = 'AutoHomeworkPlugin'

  async handleHomework(homework: Homework, course: Course): Promise<void> {
    try {
      logger.log(`[AutoHomeworkPlugin] 处理作业: ${course.name} - ${homework.type} - ${homework.description}`)

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
          // 点将作业不需要完成
          logger.log(`[AutoHomeworkPlugin] 跳过点将作业: ${homework.description}`)
          break
        case '测验':
        case '过关练习':
        case '粘贴板':
          // 预留接口，后续实现
          logger.log(`[AutoHomeworkPlugin] 预留接口: ${homework.type} - ${homework.description}`)
          break
        default:
          logger.warning(`[AutoHomeworkPlugin] 未知作业类型: ${homework.type}`)
      }
    } catch (err) {
      logger.error(`[AutoHomeworkPlugin] 处理作业失败: ${course.name} - ${homework.type}`, err)
    }
  }

  /**
   * 处理学习资料作业
   * 自动完成: 发送"已阅读"评论和点赞自己消息
   */
  private async handleStudyMaterial(homework: Homework, _course: Course): Promise<void> {
    if (!homework.courseElementId) {
      logger.warning(`[AutoHomeworkPlugin] 学习资料作业缺少 courseElementId`)
      return
    }

    try {
      // 发送"已阅读"评论
      const commentResult = await studyMaterial.sendComment(homework.courseElementId, '已阅读')
      
      if (commentResult.success && commentResult.commentId) {
        logger.log(`[AutoHomeworkPlugin] 学习资料评论发送成功: ${commentResult.commentId}`)
        
        // 点赞自己的评论
        const appreciationResult = await studyMaterial.appreciation('add', commentResult.commentId)
        if (appreciationResult.success) {
          logger.log(`[AutoHomeworkPlugin] 学习资料评论点赞成功`)
        } else {
          logger.warning(`[AutoHomeworkPlugin] 学习资料评论点赞失败: ${appreciationResult.message}`)
        }
      } else {
        logger.warning(`[AutoHomeworkPlugin] 学习资料评论发送失败: ${commentResult.message}`)
      }
    } catch (err) {
      logger.error(`[AutoHomeworkPlugin] 处理学习资料作业失败`, err)
    }
  }

  /**
   * 处理一句话问答作业
   * 自动完成: 使用已回答列表的答案，采用算法选择最优答案
   */
  private async handleSimpleQA(homework: Homework, course: Course): Promise<void> {
    // TODO: 可以先查看答案列表是否足够, 否则延迟完成
    if (!homework.courseElementId || !course.interactiveClassroomId) {
      logger.warning(`[AutoHomeworkPlugin] 一句话问答作业缺少必要参数`)
      return
    }

    try {
      // 获取已回答列表
      const commentList = await simpleQA.getComments(course.interactiveClassroomId, homework.courseElementId)
      
      if (commentList.comment.length === 0) {
        logger.log(`[AutoHomeworkPlugin] 一句话问答暂无已回答内容，跳过`)
        return
      }

      // 选择最优答案算法
      const bestAnswer = this.selectBestSimpleQAAnswer(commentList.comment)
      
      // 提交答案
      const result = await simpleQA.sendComment(homework.courseElementId, bestAnswer)
      
      if (result.success) {
        logger.log(`[AutoHomeworkPlugin] 一句话问答提交成功: ${bestAnswer}`)
      } else {
        logger.warning(`[AutoHomeworkPlugin] 一句话问答提交失败`)
      }
    } catch (err) {
      logger.error(`[AutoHomeworkPlugin] 处理一句话问答作业失败`, err)
    }
  }

  /**
   * 选择一句话问答的最优答案
   * 算法: 优先选择长度适中、内容完整的答案
   */
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

  /**
   * 处理调查作业
   * 自动完成: 随机选择选项并提交
   */
  private async handleInquiry(homework: Homework, course: Course): Promise<void> {
    if (!homework.courseElementId || !course.interactiveClassroomId || !course.scheduleId || !course.lessonId) {
      logger.warning(`[AutoHomeworkPlugin] 调查作业缺少必要参数`)
      return
    }

    try {
      // 获取调查内容
      const inquiryData = await inquiry.getInquiry(
        course.interactiveClassroomId,
        homework.courseElementId,
        course.scheduleId,
        course.lessonId
      )

      if (!inquiryData.operatorId || !inquiryData.teacherId || !inquiryData.chapterId) {
        logger.warning(`[AutoHomeworkPlugin] 调查数据不完整`)
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
        } else if (question.inputType === 'checkbox') {
          // 多选：随机选择1-3个选项
          const selectedCount = Math.min(Math.floor(Math.random() * 3) + 1, availableOptions.length)
          const shuffled = [...availableOptions].sort(() => 0.5 - Math.random())
          return {
            questionId: question.id,
            optionIds: shuffled.slice(0, selectedCount).map(option => option.value)
          }
        } else {
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
        logger.log(`[AutoHomeworkPlugin] 调查提交成功`)
      } else {
        logger.warning(`[AutoHomeworkPlugin] 调查提交失败: ${result.message}`)
      }
    } catch (err) {
      logger.error(`[AutoHomeworkPlugin] 处理调查作业失败`, err)
    }
  }

  async install(eventBus: TypedEventBus) {
    logger.log('[AutoHomeworkPlugin] 安装自动完成作业插件')
    
    // 监听作业发布事件
    eventBus.on('homework:published', async (data) => {
      const { homework, course } = data
      await this.handleHomework(homework, course)
    })
  }
}
