import { getCheckinCode, getCheckinStatus, submitCheckin } from '@/api/adapters/course'
import { Plugin } from '@/auto'
import { TypedEventBus } from '../core/TypedEventBus'
import { type Logger } from '@/utils/logger'

export class AutoCheckinPlugin implements Plugin {
  name = '自动签到'
  logger!: Logger

  async handleCheckin(course: any) {
    try {
      const { canCheckin, checkId } = await getCheckinStatus(course.interactiveClassroomId!)
      if (!canCheckin || !checkId) {
        this.logger.error('现在无法签到, 因为没有签到id')
        return
      }

      const checkinCode = await getCheckinCode(checkId)
      const checkinResult = await submitCheckin(course.interactiveClassroomId!, checkinCode)
      if (checkinResult.success) {
        this.logger.success(`${course.name}签到成功`)
      } else {
        throw new Error(checkinResult.message)
      }
    } catch (err) {
      this.logger.error(`${course.name}签到失败:`, err)
    }
  }

  async install(logger: Logger, eventBus: TypedEventBus) {
    this.logger = logger

    eventBus.on('course:classStart', async (data) => {
      const { course } = data
      console.log(`[AutoCheckinPlugin] 课程 ${course.name} 开始上课`)
      await this.handleCheckin(course)
    })
  }
}
