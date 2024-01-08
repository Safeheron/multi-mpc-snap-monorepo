import { assign, enums, Infer, literal, object, string } from 'superstruct'

export const JsonRpcIdStruct = string()

export const CommonHeader = {
  jsonrpc: literal('2.0'),
  id: JsonRpcIdStruct,
}

export interface SuccessResponse<T> {
  success: true
  data: T
}
export interface FailedResponse {
  success: false
  errMsg: string
}
export type SnapRpcResponse<T = any> = SuccessResponse<T> | FailedResponse

export const ComputeMessageStruct = object({
  p2p_message: string(),
  broadcast_message: string(),
  source: string(),
  destination: string(),
})
export type ComputeMessage = Infer<typeof ComputeMessageStruct>

export interface RunRoundResponse {
  isComplete: false
  message: ComputeMessage[]
}

export interface HeartbeatRequest {
  method: 'mpc_snapKeepAlive'
}

export const PartyIdStruct = enums(['A', 'B', 'C'])
export type PartyId = Infer<typeof PartyIdStruct>

export const PartyStruct = object({
  party_id: string(),
  index: string(),
})
export type Party = Infer<typeof PartyStruct>

export const PartyWithPubStruct = assign(
  PartyStruct,
  object({
    pub: string(),
  })
)
export type PartyWithPub = Infer<typeof PartyWithPubStruct>

export const PubAndZkpStruct = object({
  X: string(),
  dlog_zkp: string(),
})
export type PubAndZkp = Infer<typeof PubAndZkpStruct>

export const PartyWithZkpStruct = assign(PartyStruct, PubAndZkpStruct)
export type PartyWithZkp = Infer<typeof PartyWithZkpStruct>

export const PartialShardStruct = object({
  partyId: PartyIdStruct,
  shard: string(),
})
export type PartialShard = Infer<typeof PartialShardStruct>

export const PubKeyStruct = object({
  partyId: PartyIdStruct,
  pubKey: string(),
})
export type PubKey = Infer<typeof PubKeyStruct>

export interface RemindFirstInstallRequest {
  method: 'internal_firstInstallRemainder'
}

export type CommonMethods =
  | HeartbeatRequest['method']
  | RemindFirstInstallRequest['method']
