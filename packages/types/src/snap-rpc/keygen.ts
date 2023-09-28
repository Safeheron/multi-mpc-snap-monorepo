import { array, Infer, literal, object, string } from 'superstruct'

import { CommonHeader, ComputeMessageStruct, PartyStruct } from './common'

export const CreateApprovalStruct = object({
  ...CommonHeader,
  method: literal('mpc_createApproval'),
  params: object({
    walletName: string(),
    party: PartyStruct,
  }),
})
export type CreateApproval = Infer<typeof CreateApprovalStruct>

export const CreateContextStruct = object({
  ...CommonHeader,
  method: literal('mpc_createContext'),
  params: object({
    sessionId: string(),
    remoteParties: array(PartyStruct),
  }),
})
export type CreateContext = Infer<typeof CreateContextStruct>

export const CreateRoundStruct = object({
  ...CommonHeader,
  method: literal('mpc_createRound'),
  params: object({
    sessionId: string(),
    messages: array(ComputeMessageStruct),
  }),
})
export type CreateRound = Infer<typeof CreateRoundStruct>

export const CreateSuccessStruct = object({
  ...CommonHeader,
  method: literal('mpc_createSuccess'),
  params: object({
    sessionId: string(),
  }),
})
export type CreateSuccess = Infer<typeof CreateSuccessStruct>

export interface CreateResult {
  isComplete: true
  pubKey: string
}
