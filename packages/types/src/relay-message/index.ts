/**
 * these type declarations are used for website and App, at webrtc communication
 */
import { AbortMessage } from './common'
import {
  KeygenRoundMessage,
  KeygenSuccessMessage,
  PartyPrepareMessage,
  PartyReadyMessage,
} from './keygen'
import {
  MnemonicReadyMessage,
  MnemonicSkipMessage,
  PartySecretKeyReadyMessage,
  RecoverPrepareMessage,
  RecoverReadyMessage,
  RecoverRoundMessage,
  RecoverSuccessMessage,
  RefreshReadyMessage,
  RefreshRoundMessage,
  RefreshSuccessMessage,
  RoleReadyMessage,
} from './recovery'
import { SignPrepareMessage, SignReadyMessage, SignRoundMessage } from './sign'

export * from './common'
export * from './keygen'
export * from './recovery'
export * from './sign'

export type RelayMessage =
  | AbortMessage
  | PartyPrepareMessage
  | PartyReadyMessage
  | KeygenRoundMessage
  | KeygenSuccessMessage
  | SignPrepareMessage
  | SignReadyMessage
  | SignRoundMessage
  | RecoverPrepareMessage
  | RoleReadyMessage
  | RecoverReadyMessage
  | MnemonicSkipMessage
  | MnemonicReadyMessage
  | RecoverSuccessMessage
  | RecoverRoundMessage
  | PartySecretKeyReadyMessage
  | RefreshReadyMessage
  | RefreshRoundMessage
  | RefreshSuccessMessage
