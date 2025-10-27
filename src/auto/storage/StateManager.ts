import type { WeeklySchedule } from "../types"
import { type PollerState } from "./types"
import { PlatformStateStorage } from "./PlatformStateStorage"
import { logger, type Logger } from "@/auto/utils/logger"

export class StateManager {
  private logger: Logger = logger.createChild("StateManager")
  private state: PollerState

  constructor(
    private stateStorage = PlatformStateStorage.create(),
    private immediatelyLoadState = true,
  ) {
    this.state = {
      lastSchedulePoll: null,
      activeHomeworkPollers: {},
    }
    if (this.immediatelyLoadState) {
      this.load()
    }
  }

  async load(): Promise<void> {
    const state = await this.stateStorage.readState(this.logger)
    this.state = state
  }

  async save(remark?: string): Promise<void> {
    await this.stateStorage.writeState(this.state, this.logger, remark)
  }

  getState(): PollerState {
    return this.state
  }

  updateSchedulePoll(data: {
    timestamp: number
    semesterWeek: number
    weeklySchedule: WeeklySchedule
  }): void {
    this.state.lastSchedulePoll = data
  }

  getHomeworkPoller(scheduleId: string) {
    return this.state.activeHomeworkPollers[scheduleId]
  }

  setHomeworkPoller(
    scheduleId: string,
    data: PollerState["activeHomeworkPollers"][string],
  ): void {
    this.state.activeHomeworkPollers[scheduleId] = data
  }

  removeHomeworkPoller(scheduleId: string): void {
    delete this.state.activeHomeworkPollers[scheduleId]
  }
}
