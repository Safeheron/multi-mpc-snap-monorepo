import { KeyringAccount, KeyringRequest } from '@metamask/keyring-api'

class StateManager {
  #state?: MPCSnapState

  get account(): MPCSnapState['account'] {
    return this.#state?.account
  }

  get requests(): MPCSnapState['requests'] {
    return this.#state?.requests ?? ({} as MPCSnapState['requests'])
  }

  async loadState() {
    let state = (await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    })) as MPCSnapState

    state = state ?? {}
    // shim empty requests
    state.requests = state.requests ?? {}

    this.#state = state
  }

  async saveOrUpdateAccount(account: SnapAccount) {
    this.#state = {
      account: account,
      requests: this.requests,
    }
    await this.#saveState()
  }

  async deleteAccount(id: string) {
    this.#state = {
      account: undefined,
      requests: this.requests,
    }
    await this.#saveState()
  }

  async addRequest(requestId: string, request: KeyringRequest) {
    const newWrapRequest: WrappedKeyringRequest = {
      createTime: Date.now(),
      request,
    }

    this.#state = {
      account: this.account,
      requests: {
        ...this.requests,
        [requestId]: newWrapRequest,
      },
    }
    await this.#saveState()
  }

  findRequest(requestId: string): KeyringRequest | undefined {
    return this.#state?.requests?.[requestId]?.request
  }

  isValidRequest(requestId: string) {
    const request = this.findRequest(requestId)
    return request !== undefined
  }

  async deleteRequest(requestId: string) {
    console.log('request state manager to delete request: ', requestId)
    const oldRequests = this.#state?.requests ?? {}
    if (!oldRequests[requestId]) {
      console.log('invalid request id: %s, not need operation', requestId)
      return
    }
    delete oldRequests[requestId]
    this.#state = {
      account: this.account,
      requests: oldRequests,
    }
    await this.#saveState()
  }

  async deleteAllRequests() {
    this.#state = {
      account: this.account,
      requests: {},
    }
    await this.#saveState()
  }

  async #saveState() {
    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState: this.#state },
    })
  }
}

export type WrappedKeyringRequest = {
  createTime: number
  request: KeyringRequest
}

export type MPCSnapState = {
  account?: SnapAccount
  requests: Record<string, WrappedKeyringRequest>
}

export type SnapAccount = KeyringAccount & {
  signKey: string
  backuped: boolean
  pubkey: string
  name: string
  synced: boolean
  walletId: string
}

export default StateManager
