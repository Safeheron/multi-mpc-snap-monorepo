import { heading, panel, text } from '@metamask/snaps-ui'
import { MPC } from '@safeheron/mpc-wasm-sdk'
import { AccountItem, SnapRpcResponse } from '@safeheron/mpcsnap-types'

import StateManager from '@/StateManager'
import ErrorMessage from '@/utils/Errors'
import {
  convertPlainAccount,
  convertSnapAccountToKeyringAccount,
  syncAccountToMetaMask,
} from '@/utils/snapAccountApi'
import { requestConfirm } from '@/utils/snapDialog'
import { errored, succeed } from '@/utils/snapRpcUtil'

export async function requestAccount(
  stateManager: StateManager
): Promise<SnapRpcResponse<AccountItem>> {
  const wallet = stateManager.account

  if (wallet) {
    return succeed(convertPlainAccount(wallet))
  } else {
    return succeed({
      address: '',
      walletName: '',
      backuped: false,
      synced: false,
      id: '',
    })
  }
}

export async function syncAccount(stateManager: StateManager) {
  const snapAccount = stateManager.account
  if (snapAccount) {
    const metamaskAccount = convertSnapAccountToKeyringAccount(snapAccount)
    try {
      await syncAccountToMetaMask(metamaskAccount)

      snapAccount.synced = true
      await stateManager.saveOrUpdateAccount(snapAccount)
    } catch (e) {
      console.error('sync account failed: ', e)
      snapAccount.synced = false
      await stateManager.saveOrUpdateAccount(snapAccount)
    }
  }
  return succeed('')
}

export async function checkMnemonic(
  walletName: string,
  stateManager: StateManager,
  mpcInstance: MPC
): Promise<SnapRpcResponse<string>> {
  await requestConfirm(
    panel([
      heading('Confirm to Check the Key Shard A?'),
      text(`Wallet Name: ${walletName}`),
    ])
  )

  const wallet = stateManager.account

  if (!wallet) {
    return errored(ErrorMessage.NO_WALLET)
  }

  try {
    const res = await mpcInstance.mpcHelper.extractMnemonicFromSignKey(
      wallet.signKey
    )
    if (res.err) {
      return errored(res.err.err_msg)
    }
    return succeed(res.mnemo!)
  } catch (error) {
    return errored(error.message)
  }
}
