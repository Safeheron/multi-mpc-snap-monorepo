import { array, Infer, literal, object, optional, string } from 'superstruct'

import {
  CommonHeader,
  ComputeMessageStruct,
  PartialShardStruct,
  PartyStruct,
  PartyWithZkpStruct,
  PubKeyStruct,
} from './common'

export interface RecoverApproval {
  method: 'mpc_recoverApproval'
}

export type RecoverApprovalResult = {
  sessionId: string
  keyshareExist: boolean
}

export const RecoverPrepareStruct = object({
  ...CommonHeader,
  method: literal('mpc_recoverPrepare'),
  params: object({
    sessionId: string(),
    walletName: string(),
    mnemonic: optional(string()),
  }),
})
export type RecoverPrepare = Infer<typeof RecoverPrepareStruct>

export const RecoverKeyPairStruct = object({
  ...CommonHeader,
  method: literal('mpc_recoverKeyPair'),
  params: object({
    sessionId: string(),
  }),
})
export type RecoverKeyPair = Infer<typeof RecoverKeyPairStruct>

export const RecoverContextStruct = object({
  ...CommonHeader,
  method: literal('mpc_recoverContext'),
  params: object({
    sessionId: string(),
    partyInfo: object({
      localPartyIndex: string(),
      remotePartyIndex: string(),
      lostPartyIndex: string(),
    }),
    remotePub: string(),
  }),
})
export type RecoverContext = Infer<typeof RecoverContextStruct>

export const RecoverRoundStruct = object({
  ...CommonHeader,
  method: literal('mpc_recoverRound'),
  params: object({
    sessionId: string(),
    messages: array(ComputeMessageStruct),
  }),
})
export type RecoverRound = Infer<typeof RecoverRoundStruct>

export interface RecoverResult {
  isComplete: true
  partySecretKey: string
  pubKeyOfThreeParty: string
}

export const RecoverMnemonicStruct = object({
  ...CommonHeader,
  method: literal('mpc_recoverMnemonic'),
  params: object({
    sessionId: string(),
    partialShards: array(PartialShardStruct),
    X: string(),
    remotePubKeys: array(PubKeyStruct),
  }),
})
export type RecoverMnemonic = Infer<typeof RecoverMnemonicStruct>

export const RefreshPrepareStruct = object({
  ...CommonHeader,
  method: literal('mpc_refreshPrepare'),
  params: object({
    sessionId: string(),
  }),
})
export type RefreshPrepare = Infer<typeof RefreshPrepareStruct>

export const RefreshContextStruct = object({
  ...CommonHeader,
  method: literal('mpc_refreshContext'),
  params: object({
    sessionId: string(),
    localParty: PartyStruct,
    remoteParties: array(PartyWithZkpStruct),
  }),
})
export type RefreshContext = Infer<typeof RefreshContextStruct>

export const RefreshRoundStruct = object({
  ...CommonHeader,
  method: literal('mpc_refreshRound'),
  params: object({
    sessionId: string(),
    messages: array(ComputeMessageStruct),
  }),
})

export type RefreshRound = Infer<typeof RefreshRoundStruct>

export const RefreshSuccessStruct = object({
  ...CommonHeader,
  method: literal('mpc_refreshSuccess'),
  params: object({
    sessionId: string(),
  }),
})
export type RefreshSuccess = Infer<typeof RefreshSuccessStruct>
