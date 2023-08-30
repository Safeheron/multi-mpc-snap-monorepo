import { SnapInvokeMethods } from '@/configs/Enums'
export interface InvokeReqModel<T> {
  method: SnapInvokeMethods
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
}
