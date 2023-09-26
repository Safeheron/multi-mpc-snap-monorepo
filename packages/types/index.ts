import {
  KeyringAccount,
  KeyringAccountStruct,
  KeyringRequest,
} from '@metamask/keyring-api'
import {
  any,
  array,
  assign,
  enums,
  Infer,
  literal,
  object,
  optional,
  record,
  string,
  union,
} from 'superstruct'

export const PartyIdStruct = enums(['A', 'B', 'C'])
export type PartyId = Infer<typeof PartyIdStruct>

export const JsonRpcIdStruct = string()

const CommonHeader = {
  jsonrpc: literal('2.0'),
  id: JsonRpcIdStruct,
}

export interface SuccessResponse<T> {
  success: true
  data: T
}

export interface FailedResponse {
  success: false
  errMsg: string
}

export type SnapRpcResponse<T = any> = SuccessResponse<T> | FailedResponse

export const PartyStruct = object({
  party_id: string(),
  index: string(),
})

export type Party = Infer<typeof PartyStruct>

export const PubAndZkpStruct = object({
  X: string(),
  dlog_zkp: string(),
})

export type PubAndZkp = Infer<typeof PubAndZkpStruct>

export const PartyWithZkpStruct = assign(PartyStruct, PubAndZkpStruct)

export type PartyWithZkp = Infer<typeof PartyWithZkpStruct>

export const PartialShardStruct = object({
  partyId: PartyIdStruct,
  shard: string(),
})

export type PartialShard = Infer<typeof PartialShardStruct>

export const PubKeyStruct = object({
  partyId: PartyIdStruct,
  pubKey: string(),
})

export type PubKey = Infer<typeof PubKeyStruct>

export const ComputeMessageStruct = object({
  p2p_message: string(),
  broadcast_message: string(),
  source: string(),
  destination: string(),
})

export type ComputeMessage = Infer<typeof ComputeMessageStruct>

export interface RunRoundResponse {
  isComplete: false
  message: ComputeMessage[]
}

export interface CreateResult {
  isComplete: true
  pubKey: string
}
export interface SignResult {
  isComplete: true
  signedTransaction: string
}
export interface RecoverResult {
  isComplete: true
  partySecretKey: string
  pubKeyOfThreeParty: string
}

export interface HeartbeatRequest {
  method: 'mpc_snapKeepAlive'
}

export interface RequestAccount {
  method: 'mpc_requestAccount'
}

export interface DeleteWallet {
  method: 'mpc_deleteWallet'
}

export const BackupApprovalStruct = object({
  ...CommonHeader,
  method: literal('mpc_backupApproval'),
  params: object({
    walletName: string(),
  }),
})

export type BackupApproval = Infer<typeof BackupApprovalStruct>

export const BackupUpdateStruct = object({
  ...CommonHeader,
  method: literal('mpc_backupUpdate'),
  params: object({
    sessionId: string(),
  }),
})

export type BackupUpdate = Infer<typeof BackupUpdateStruct>

export const CheckMnemonicStruct = object({
  ...CommonHeader,
  method: literal('mpc_checkMnemonic'),
  params: object({
    walletName: string(),
  }),
})

export type CheckMnemonic = Infer<typeof CheckMnemonicStruct>

export const CreateApprovalStruct = object({
  ...CommonHeader,
  method: literal('mpc_createApproval'),
  params: object({
    walletName: string(),
    party: PartyStruct,
  }),
})

export type CreateApproval = Infer<typeof CreateApprovalStruct>

export const CreateContextStruct = object({
  ...CommonHeader,
  method: literal('mpc_createContext'),
  params: object({
    sessionId: string(),
    remoteParties: array(PartyStruct),
  }),
})

export type CreateContext = Infer<typeof CreateContextStruct>

export const CreateRoundStruct = object({
  ...CommonHeader,
  method: literal('mpc_createRound'),
  params: object({
    sessionId: string(),
    messages: array(ComputeMessageStruct),
  }),
})

export type CreateRound = Infer<typeof CreateRoundStruct>

export const CreateSuccessStruct = object({
  ...CommonHeader,
  method: literal('mpc_createSuccess'),
  params: object({
    sessionId: string(),
  }),
})

export type CreateSuccess = Infer<typeof CreateSuccessStruct>

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

export type RecoverMnemonic = typeof RecoverMnemonicStruct

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

export type MetamaskSnapMpcSnapRequest =
  | HeartbeatRequest
  | RequestAccount
  | DeleteWallet
  | BackupApproval
  | BackupUpdate
  | CheckMnemonic
  | CreateApproval
  | CreateContext
  | CreateRound
  | CreateSuccess
  | SignApproval
  | SignContext
  | SignRound
  | RecoverApproval
  | RecoverPrepare
  | RecoverKeyPair
  | RecoverContext
  | RecoverRound
  | RecoverMnemonic
  | RefreshContext
  | RefreshRound
  | RefreshPrepare
  | RefreshSuccess

export interface AccountItem {
  walletName: string
  address: string
  pubKey?: string
  signKey?: string
  backuped?: boolean
}

export interface TransactionBaseParams {
  to: string
  nonce: string
  value: string
  chainId: string
  /**
   * @deprecated
   */
  chainName?: string
  data: string

  gasLimit: string
}

export interface LegacyParams {
  type: 0 | 1
  gasPrice: string
}

export type AccessList = Array<{ address: string; storageKeys: Array<string> }>

export type AccessListish =
  | AccessList
  | Array<[string, Array<string>]>
  | Record<string, Array<string>>

export interface Eip1559Params {
  type: 2
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  accessList?: AccessListish
}

export type TransactionObject = TransactionBaseParams &
  (LegacyParams | Eip1559Params)

export type KeyringAccountSupportedMethodsArray =
  KeyringAccount['supportedMethods']

export type KeyringAccountSupportedMethods =
  KeyringAccountSupportedMethodsArray[number]

export type WrappedKeyringRequest = {
  createTime: number
  request: KeyringRequest
}
