import { heading, panel, text } from '@metamask/snaps-ui'
import { MPC } from '@safeheron/mpc-wasm-sdk'
import { AccountItem, SnapRpcResponse } from '@safeheron/mpcsnap-types'

import StateManager from '@/StateManager'
import ErrorMessage from '@/utils/Errors'
import { convertAccount, syncAccountToMetaMask } from '@/utils/snapAccountApi'
import { requestConfirm } from '@/utils/snapDialog'
import { errored, succeed } from '@/utils/snapRpcUtil'

export async function requestAccount(
  stateManager: StateManager
): Promise<SnapRpcResponse<AccountItem>> {
  const wallet = stateManager.account

  if (wallet) {
    const address = wallet.address
    const walletName = wallet.name
    const backuped = wallet.backuped
    const data = {
      address,
      walletName,
      backuped,
    }
    return succeed(data)
  } else {
    return succeed({
      address: '',
      walletName: '',
      backuped: false,
    })
  }
}

export async function syncAccount(stateManager: StateManager) {
  const snapAccount = stateManager.account
  if (snapAccount) {
    const metamaskAccount = convertAccount(snapAccount)
    await syncAccountToMetaMask(metamaskAccount)
  }
  return succeed()
}

/**
 * TODO delete
 * @deprecated
 * @param stateManager
 */
export async function deleteWallet(
  stateManager: StateManager
): Promise<SnapRpcResponse> {
  const wallet = stateManager.account

  if (!wallet) {
    return errored(ErrorMessage.NO_WALLET)
  }

  await requestConfirm(
    panel([
      heading('Delete MPC Wallet'),
      text('Address:'),
      text(wallet.address),
    ])
  )

  try {
    return { success: true, data: true }
  } catch (error) {
    console.error(error)

    return { success: false, errMsg: error.message || 'Delete failed.' }
  }
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
