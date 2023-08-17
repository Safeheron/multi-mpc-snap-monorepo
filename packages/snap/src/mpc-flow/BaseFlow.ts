import { MPC } from '@safeheron/mpc-wasm-sdk'

import StateManager, { SnapAccount } from '@/StateManager'
import ErrorMessage from '@/utils/Errors'

export class BaseFlow {
  protected readonly stateManager: StateManager
  protected readonly mpcInstance: MPC

  protected sessionId?: string

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    this.stateManager = stateManager
    this.mpcInstance = mpcInstance
  }

  getWalletWithError(): SnapAccount {
    const wallet = this.stateManager.account
    if (!wallet || !wallet.signKey) {
      throw new Error(ErrorMessage.NO_WALLET)
    }
    return wallet
  }

  getWallet(): SnapAccount | undefined {
    const wallet = this.stateManager.account
    return wallet
  }

  protected verifySession(sessionId: string) {
    if (!sessionId || sessionId !== this.sessionId) {
      throw new Error(ErrorMessage.SESSION_INVALID)
    }
  }
}
