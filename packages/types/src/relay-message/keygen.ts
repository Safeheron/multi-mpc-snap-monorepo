import { ComputeMessage } from '../snap-rpc'
import { BaseRelayMessage, OperationType } from './common'

/**
 * This message is what website send to App, to give app some info it needed to known
 */
export type PartyPrepareMessage = BaseRelayMessage<
  OperationType.partyPrepare,
  any,
  { walletName: string; partyId: string; sessionId: string }
>

/**
 * all the participants need to emit this message, and all the participants need
 * receive all the others party's `PartyReadyMessage` before next step
 */
export type PartyReadyMessage = BaseRelayMessage<
  OperationType.partyReady,
  undefined,
  { party_id: string; index: string; pub: string }
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
