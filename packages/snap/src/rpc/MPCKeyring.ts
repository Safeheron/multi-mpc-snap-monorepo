import {
  Keyring,
  KeyringAccount,
  KeyringRequest,
  SubmitRequestResponse,
} from '@metamask/keyring-api'
import { Json } from '@metamask/snaps-types'

import StateManager from '@/StateManager'
import { convertAccount, submitSignResponse } from '@/utils/snapAccountApi'

export class MPCKeyring implements Keyring {
  private stateManager: StateManager
  constructor(stateManager: StateManager) {
    this.stateManager = stateManager
  }

  createAccount(
    name: string,
    options?: Record<string, Json> | null
  ): Promise<KeyringAccount> {
    throw new Error(
      'This method is not supported. You can create MPC account only through our website.'
    )
  }

  updateAccount(account: KeyringAccount): Promise<void> {
    throw new Error(
      'This method is not supported. You can create update account only through our website.'
    )
  }

  async deleteAccount(id: string) {
    const account = this.stateManager.account
    if (account && account.id === id) {
      await this.stateManager.deleteAccount(id)
    }
  }

  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    return chains.filter(chain => isEvmChain(chain))
  }

  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    const localAccount = this.stateManager.account
    const keyringAccount = localAccount
      ? convertAccount(localAccount)
      : undefined
    return keyringAccount
  }

  async getRequest(id: string): Promise<KeyringRequest | undefined> {
    return this.stateManager.requests[id]
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    const localAccount = this.stateManager.account
    const keyringAccount = localAccount && convertAccount(localAccount)
    console.log('list accounts result >>', keyringAccount)
    return keyringAccount ? [keyringAccount] : []
  }

  async listRequests(): Promise<KeyringRequest[]> {
    return Object.values(this.stateManager.requests)
  }

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    const requestId = request.request.id
    await this.stateManager.addRequest(requestId, request)
    return { pending: true }
  }

  async approveRequest(id: string): Promise<void> {
    throw new Error(
      'The "approveRequest" method is not available on this snap.'
    )
  }

  async rejectRequest(id: string): Promise<void> {
    await submitSignResponse(id, null)
    await this.stateManager.deleteRequest(id)
  }
}

export function isEvmChain(caip2ChainId: string): boolean {
  return caip2ChainId.startsWith('eip155:')
}
