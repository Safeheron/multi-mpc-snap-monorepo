import { SnapRpcMethods } from '@safeheron/mpcsnap-types'
export interface InvokeReqModel<T> {
  method: SnapRpcMethods
  params?: T
}

export interface BaseTxObj {
  to: string
  data: string //hex
  value: string
}

export interface HashItemModel {
  derivePath: string
  hash: string
  sig: {
    formatSig: string
    r: string
    s: string
    v: string
  }
}

export interface FeeData {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasLimit: string
  gasPrice?: string
}
