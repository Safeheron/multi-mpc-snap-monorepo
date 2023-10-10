import { ComputeMessage } from '../snap-rpc'
import { BaseRelayMessage, OperationType } from './common'

export type RecoverPrepareMessage = BaseRelayMessage<
  OperationType.recoverPrepare,
  undefined,
  { index: number; sessionId: string }
>

export type RoleReadyMessage = BaseRelayMessage<
  OperationType.roleReady,
  undefined,
  { partyId: string; index: number; walletId?: string }
>

export type RecoverReadyMessage = BaseRelayMessage<
  OperationType.recoverReady,
  undefined,
  boolean
>

export type MnemonicSkipMessage = BaseRelayMessage<
  OperationType.mnemonicSkip,
  'broadcast',
  undefined
>

export type MnemonicReadyMessage = BaseRelayMessage<
  OperationType.mnemonicReady,
  undefined,
  {
    walletName: string
    hasMnemonic: boolean
    partyId: string
  }
>

export type KeypairReadyMessage = BaseRelayMessage<
  OperationType.keyPairReady,
  undefined,
  { partyId: string; pubKey: string }
>

export type RecoverSuccessMessage = BaseRelayMessage<
  OperationType.recoverSuccess,
  undefined,
  null
>

export type RecoverRoundMessage = BaseRelayMessage<
  OperationType.recoverRound,
  'p2p',
  ComputeMessage[]
>

export type PartySecretKeyReadyMessage = BaseRelayMessage<
  OperationType.partySecretKeyReady,
  'broadcast',
  {
    partyId: string
    partySecretKey: string
    pubKeyOfThreeParty: string
  }
>

export type RefreshReadyMessage = BaseRelayMessage<
  OperationType.refreshReady,
  undefined,
  {
    X: string
    dlog_zkp: string
    partyId: string
  }
>

export type RefreshRoundMessage = BaseRelayMessage<
  OperationType.refreshRound,
  undefined,
  ComputeMessage[]
>

export type RefreshSuccessMessage = BaseRelayMessage<
  OperationType.refreshSuccess,
  undefined,
  '' | null
>
