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
    this.#state = {
      account: this.account,
      requests: {
        ...this.requests,
        [requestId]: request,
      },
    }
    await this.#saveState()
  }

  async deleteRequest(requestId: string) {
    const oldRequests = this.#state?.requests ?? {}
    if (!Object.prototype.hasOwnProperty.call(oldRequests, requestId)) {
      return
    }
    delete oldRequests[requestId]
    this.#state = {
      account: this.account,
      requests: oldRequests,
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

export type MPCSnapState = {
  account?: SnapAccount
  requests: Record<string, KeyringRequest>
}

export type SnapAccount = KeyringAccount & {
  signKey: string
  backuped: boolean
  pubkey: string
}

export default StateManager
