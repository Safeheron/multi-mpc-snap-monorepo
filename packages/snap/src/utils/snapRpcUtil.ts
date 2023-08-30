import { SnapRpcResponse } from '@safeheron/mpcsnap-types'

export function succeed(data?: any): SnapRpcResponse {
  return { success: true, data }
}

export function errored(message: string): SnapRpcResponse {
  return { success: false, errMsg: message }
}
