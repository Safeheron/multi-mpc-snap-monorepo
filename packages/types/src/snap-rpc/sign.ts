import { EthMethod } from '@metamask/keyring-api'
import {
  any,
  array,
  enums,
  Infer,
  literal,
  object,
  optional,
  record,
  string,
  union,
} from 'superstruct'

import { CommonHeader, ComputeMessageStruct } from './common'

export const SignApprovalStruct = object({
  ...CommonHeader,
  method: literal('mpc_signApproval'),
  params: object({
    method: enums(Object.values(EthMethod)),
    params: union([record(string(), any()), string()]),
    requestId: optional(string()),
  }),
})
export type SignApproval = Infer<typeof SignApprovalStruct>

export const SignApprovalResultStruct = object({
  sessionId: string(),
  pub: string(),
})
export type SignApprovalResult = Infer<typeof SignApprovalResultStruct>

export const SignContextStruct = object({
  ...CommonHeader,
  method: literal('mpc_signContext'),
  params: object({
    sessionId: string(),
    partyIds: array(string()),
    remotePub: object({
      partyId: string(),
      pub: string(),
    }),
  }),
})
export type SignContext = Infer<typeof SignContextStruct>

export const SignRoundStruct = object({
  ...CommonHeader,
  method: literal('mpc_signRound'),
  params: object({
    sessionId: string(),
    messages: array(ComputeMessageStruct),
  }),
})
export type SignRound = Infer<typeof SignRoundStruct>

export interface SignResult {
  isComplete: true
  signedTransaction: string
}

export type SignMethods =
  | SignApproval['method']
  | SignContext['method']
  | SignRound['method']
