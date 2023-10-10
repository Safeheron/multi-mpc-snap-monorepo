import { ComputeMessage } from '../snap-rpc'
import { BaseRelayMessage, OperationType } from './common'

export type PartyPrepareMessage = BaseRelayMessage<
  OperationType.partyPrepare,
  any,
  { walletName: string; partyId: string; sessionId: string }
>

export type PartyReadyMessage = BaseRelayMessage<
  OperationType.partyReady,
  undefined,
  { party_id: string; index: string }
>

export type KeygenRoundMessage = BaseRelayMessage<
  OperationType.keyGenRound,
  undefined,
  ComputeMessage[]
>

export type KeygenSuccessMessage = BaseRelayMessage<
  OperationType.createSuccess,
  undefined,
  null
>
