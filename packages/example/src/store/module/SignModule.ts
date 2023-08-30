import { KeyringRequest } from '@metamask/keyring-api'
import { SignApproval } from '@safeheron/mpcsnap-types'
import { makeAutoObservable } from 'mobx'

export default class SignModule {
  pendingRequest: PendingRequest

  constructor() {
    makeAutoObservable(this)
  }

  setPendingRequest(pr: PendingRequest) {
    this.pendingRequest = pr
  }
}

export type PendingRequest = {
  originalMethod: KeyringRequest['request']['method']
  method: SignApproval['params']['method']
  params: Record<string, any>
}
