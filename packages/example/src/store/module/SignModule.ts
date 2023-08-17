import { EthMethod } from '@metamask/keyring-api'
import { makeAutoObservable } from 'mobx'

export default class SignModule {
  pendingRequest: PendingRequest

  communicationPub = ''

  constructor() {
    makeAutoObservable(this)
  }

  setCommunicationPub(pub: string) {
    this.communicationPub = pub
  }

  setPendingRequest(pr: PendingRequest) {
    const { method, params } = pr
    if (method === EthMethod.SignTransaction) {
      const fixedParams = {
        ...params,
        type: parseInt('' + params.type, 16),
      }
      this.pendingRequest = { ...pr, params: fixedParams }
    } else {
      this.pendingRequest = pr
    }
  }
}

export type PendingRequest = {
  method: EthMethod
  params: Record<string, any>
  createTime: number
  // hex-string
  chainId?: string
}
