import { SnapRpcResponse } from '@safeheron/mpcsnap-types'

import StateManager, { WrappedKeyringRequest } from '@/StateManager'
import { succeed } from '@/utils/snapRpcUtil'

export async function listPendingRequests(
  stateManager: StateManager
): Promise<SnapRpcResponse<WrappedKeyringRequest[]>> {
  return succeed(Object.values(stateManager.requests ?? []))
}
