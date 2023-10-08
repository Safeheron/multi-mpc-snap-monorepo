import { ComputeMessage } from '../snap-rpc'
import { BaseRelayMessage, OperationType, SendType } from './common'

export type RecoverPrepareMessage = BaseRelayMessage<
  OperationType.recoverPrepare,
  undefined,
  { index: number }
>

export type RoleReadyMessage = BaseRelayMessage<
  OperationType.roleReady,
  undefined,
  { partyId: string; index: number }
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

export type keypairReadyMessage = BaseRelayMessage<
  OperationType.keyPairReady,
  undefined,
  { partyId: string; pubKey: string }
>

export type recoverSuccessMessage = BaseRelayMessage<
  OperationType.recoverSuccess,
  undefined,
  null
>

export type recoverRoundMessage = BaseRelayMessage<
  OperationType.recoverRound,
  'p2p',
  ComputeMessage[]
>

export type partySecretKeyReadyMessage = BaseRelayMessage<
  OperationType.partySecretKeyReady,
  'broadcast',
  {
    partyId: string
    partySecretKey: string
    pubKeyOfThreeParty: string
  }
>

export type refreshReadyMessage = BaseRelayMessage<
  OperationType.refreshReady,
  undefined,
  {
    X: string
    dlog_zkp: string
    partyId: string
  }
>

export type refreshRoundMessage = BaseRelayMessage<
  OperationType.refreshRound,
  undefined,
  ComputeMessage[]
>

export type refreshSuccessMessage = BaseRelayMessage<
  OperationType.refreshSuccess,
  undefined,
  '' | null
>
