import { KeyringAccount } from '@metamask/keyring-api'
import { heading, panel, text } from '@metamask/snaps-ui'
import { MPC, MPCHelper } from '@safeheron/mpc-wasm-sdk'
import { AccountItem, SnapRpcResponse } from '@safeheron/mpcsnap-types'
import { v4 as getUuid } from 'uuid'

import StateManager from '@/StateManager'
import {
  convertPlainAccount,
  convertSnapAccountToKeyringAccount,
  syncAccountToMetaMask,
} from '@/utils/snapAccountApi'
import { requestConfirm } from '@/utils/snapDialog'
import { errored, succeed } from '@/utils/snapRpcUtil'

import { BaseFlow } from './BaseFlow'

class BackupFlow extends BaseFlow {
  private mpcHelper: MPCHelper

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)
    this.mpcHelper = mpcInstance.mpcHelper
  }

  async backupApproval(
    walletName: string
  ): Promise<SnapRpcResponse<{ sessionId: string; mnemonic: string }>> {
    const wallet = this.getWalletWithError()

    await requestConfirm(
      panel([
        heading('Confirm to backup the wallet?'),
        text(`Wallet Name: ${walletName}`),
      ])
    )

    const sessionId = getUuid()
    this.sessionId = sessionId
    const res = await this.mpcHelper.extractMnemonicFromSignKey(wallet.signKey)
    if (res.err) {
      return errored(res.err.err_msg)
    }

    return succeed({ sessionId, mnemonic: res.mnemo })
  }

  async finishBackup(sessionId: string): Promise<SnapRpcResponse<AccountItem>> {
    this.verifySession(sessionId)

    const wallet = this.getWalletWithError()

    // Set backup status true first and save
    wallet.backuped = true
    await this.stateManager.saveOrUpdateAccount(wallet)

    // Then add account to metamask
    // In this action, if something went wrong, ignored.
    // Since that user can sync account any time in website
    const metamaskAccount: KeyringAccount =
      convertSnapAccountToKeyringAccount(wallet)
    try {
      await syncAccountToMetaMask(metamaskAccount)
      wallet.synced = true
      await this.stateManager.saveOrUpdateAccount(wallet)
    } catch (e) {
      wallet.synced = false
      await this.stateManager.saveOrUpdateAccount(wallet)
      console.error('cannot sync account to MetaMask', e)
    }

    return succeed(convertPlainAccount(wallet))
  }
}

export default BackupFlow
