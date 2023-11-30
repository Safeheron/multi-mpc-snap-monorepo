import { PartyId } from '../snap-rpc'

export enum OperationType {
  partyPrepare = 'partyPrepare',
  partyReady = 'partyReady',
  keyGenRound = 'keyGenRound',
  createSuccess = 'createSuccess',

  signPrepare = 'signPrepare',
  signReady = 'signReady',
  signRound = 'signRound',

  roleReady = 'roleReady',
  recoverPrepare = 'recoverPrepare',
  keyPairReady = 'keyPairReady',
  recoverReady = 'recoverReady',
  mnemonicReady = 'mnemonicReady',
  recoverRound = 'recoverRound',
  partySecretKeyReady = 'partySecretKeyReady',
  recoverSuccess = 'recoverSuccess',
  refreshReady = 'refreshReady',
  refreshRound = 'refreshRound',
  refreshSuccess = 'refreshSuccess',

  mnemonicSkip = 'mnemonicSkip',

  abort = 'abort',
}

export type SendType = 'p2p' | 'broadcast' | 'all'

export type BaseRelayMessage<
  T extends OperationType,
  P extends SendType | undefined,
  Q
> = {
  from?: string
  to?: string
  messageType: T
  sendType?: P
  messageContent: Q
}

export type AbortMessageContent = {
  businessType: 'keygen' | 'sign' | 'recover'
  abortType: 'error' | 'userCancel'
  reason: string
  from?: PartyId
}

export type AbortMessage = BaseRelayMessage<
  OperationType.abort,
  'broadcast',
  AbortMessageContent
>
