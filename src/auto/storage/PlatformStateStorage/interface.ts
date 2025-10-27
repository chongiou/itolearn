import type { Logger } from "@/auto/utils/logger"
import type { PollerState } from "../types"

export interface StateStorage {
  readState(logger: Logger): Promise<PollerState>
  writeState(state: PollerState, logger: Logger, sourceRemark?: string): Promise<void>
}
