import {
  emitSnapKeyringEvent,
  Keyring,
  KeyringAccount,
  KeyringEvent,
  KeyringRequest,
  SubmitRequestResponse,
} from '@metamask/keyring-api'
import { Json } from '@metamask/snaps-types'
import { panel, text } from '@metamask/snaps-ui'

import StateManager from '@/StateManager'
import { convertSnapAccountToKeyringAccount } from '@/utils/snapAccountApi'
import { requestAlert } from '@/utils/snapDialog'

export class MPCKeyring implements Keyring {
  private stateManager: StateManager
  constructor(stateManager: StateManager) {
    this.stateManager = stateManager
  }

  createAccount(
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
      account.synced = false
      await this.stateManager.saveOrUpdateAccount(account)
      await this.stateManager.deleteAllRequests()
    }
  }

  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    return chains.filter(chain => isEvmChain(chain))
  }

  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    const localAccount = this.stateManager.account
    const keyringAccount = localAccount
      ? convertSnapAccountToKeyringAccount(localAccount)
      : undefined
    return keyringAccount
  }

  async getRequest(id: string): Promise<KeyringRequest | undefined> {
    return this.stateManager.findRequest(id)
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    const localAccount = this.stateManager.account
    const keyringAccount =
      localAccount && convertSnapAccountToKeyringAccount(localAccount)
    const result = keyringAccount ? [keyringAccount] : []
    console.log('list accounts result >>', result)
    return result
  }

  async listRequests(): Promise<KeyringRequest[]> {
    return Object.values(this.stateManager.requests).map(r => r.request)
  }

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    const requestId = request.id
    await this.stateManager.addRequest(requestId, request)

    return {
      pending: true,
      redirect: {
        message:
          'Please go to the Safeheron Snap Website to continue with the transaction.',
        url: REDIRECT_URL,
      },
    }
  }

  async approveRequest(id: string): Promise<void> {
    throw new Error(
      'The "approveRequest" method is not available on this snap.'
    )
  }

  async rejectRequest(id: string): Promise<void> {
    await this.stateManager.deleteRequest(id)
    try {
      await emitSnapKeyringEvent(snap, KeyringEvent.RequestRejected, { id })
    } catch (e) {
      /* do nothing */
    }
  }
}

export function isEvmChain(caip2ChainId: string): boolean {
  return caip2ChainId.startsWith('eip155:')
}
