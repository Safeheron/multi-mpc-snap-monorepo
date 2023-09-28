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

const KeyringAccountSupportedMethodsStruct = enums([
  'personal_sign',
  'eth_sendTransaction',
  'eth_sign',
  'eth_signTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v2',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
])

export const SignApprovalStruct = object({
  ...CommonHeader,
  method: literal('mpc_signApproval'),
  params: object({
    method: KeyringAccountSupportedMethodsStruct,
    params: union([record(string(), any()), string()]),
    requestId: optional(string()),
  }),
})
export type SignApproval = Infer<typeof SignApprovalStruct>

export const SignContextStruct = object({
  ...CommonHeader,
  method: literal('mpc_signContext'),
  params: object({
    sessionId: string(),
    partyIds: array(string()),
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
