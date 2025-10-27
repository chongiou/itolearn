import { getCheckinCode, getCheckinStatus, submitCheckin } from '@/api/adapters/course'
import { Plugin } from '@/auto'
import { TypedEventBus } from '../core/TypedEventBus'
import { logger } from '@/auto/utils/logger'

export class AutoCheckinPlugin implements Plugin {
  name = 'AutoCheckinPlugin'

  async handleCheckin(course: any) {
    try {
      const { canCheckin, checkId } = await getCheckinStatus(course.interactiveClassroomId!)
      if (!canCheckin) return

      const checkinCode = await getCheckinCode(checkId)
      const success = await submitCheckin(course.interactiveClassroomId!, checkinCode)
      logger.log(`[AutoCheckinPlugin] ${course.name}签到${success ? '成功' : '失败'}`)
    } catch (err) {
      logger.error(`[AutoCheckinPlugin] ${course.name}签到失败:`, err)
    }
  }

  async install(eventBus: TypedEventBus) {
    logger.log('[AutoCheckinPlugin] 安装内置插件')
    eventBus.on('course:classStart', async (data) => {
      const { course } = data
      console.log(`[AutoCheckinPlugin] 课程 ${course.name} 开始上课`)
      await this.handleCheckin(course)
    })
  }
}
