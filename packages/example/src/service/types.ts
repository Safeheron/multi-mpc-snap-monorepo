import { OperationType } from '@safeheron/mpcsnap-types'

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

export function getPartyIndex(partyId: string | PartyId) {
  return PartyIndexMap[partyId]
}

export function getPartyId(index: number): PartyId | undefined {
  return [undefined, PartyId.A, PartyId.B, PartyId.C][index]
}

type MessageSendType = 'all' | 'broadcast' | 'p2p'

export type MPCMessage<T = any> = {
  from: string
  messageType: OperationType
  messageContent: T
  sendType?: MessageSendType
  to?: string
}
