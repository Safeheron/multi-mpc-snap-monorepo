import { KeyringAccount } from '@metamask/keyring-api'
import { heading, panel, text } from '@metamask/snaps-ui'
import { MPC, MPCHelper } from '@safeheron/mpc-wasm-sdk'
import { AccountItem, SnapRpcResponse } from '@safeheron/mpcsnap-types'
import { v4 as getUuid } from 'uuid'

import StateManager from '@/StateManager'
import {
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
    wallet.backuped = true

    // First add account to metamask
    const metamaskAccount: KeyringAccount =
      convertSnapAccountToKeyringAccount(wallet)
    await syncAccountToMetaMask(metamaskAccount)
    console.log('sync account to metamask result: ', metamaskAccount)

    // Update snap local state
    await this.stateManager.saveOrUpdateAccount(wallet)

    return succeed({
      address: wallet.address,
      backuped: wallet.backuped,
      walletName: wallet.name,
    })
  }
}

export default BackupFlow
