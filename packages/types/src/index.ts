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

export * from './keyring.types'
export * from './snap-rpc/index'
