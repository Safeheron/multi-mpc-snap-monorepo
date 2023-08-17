export enum PartyId {
  A = 'A',
  B = 'B',
  C = 'C',
}

export const PartyIndexMap = {
  [PartyId.A]: '1',
  [PartyId.B]: '2',
  [PartyId.C]: '3',
}

// TODO replace with mpcsnap-types declarations
export enum MPCMessageType {
  partyPrepare = 'partyPrepare',
  partyReady = 'partyReady',
  keyGenRound = 'keyGenRound',
  createSuccess = 'createSuccess',

  signPrepare = 'signPrepare',
  signReady = 'signReady',
  signRound = 'signRound',

  recoverPrepare = 'recoverPrepare',
  recoverReady = 'recoverReady',
  mnemonicReady = 'mnemonicReady',
  keyPairReady = 'keyPairReady',

  recoverSuccess = 'recoverSuccess',
  refreshReady = 'refreshReady',
  refreshRound = 'refreshRound',
  refreshSuccess = 'refreshSuccess',

  roleReady = 'roleReady',

  // 2/3
  recoverRound = 'recoverRound',

  // broadcast
  partySecretKeyReady = 'partySecretKeyReady',
  mnemonicSkip = 'mnemonicSkip',
  abort = 'abort',
}

type MessageSendType = 'all' | 'broadcast' | 'p2p'

export type MPCMessage<T = any> = {
  from: string
  messageType: MPCMessageType
  messageContent: T
  sendType?: MessageSendType
  to?: string
}
