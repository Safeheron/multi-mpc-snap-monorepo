import { KeyringAccount } from '@metamask/keyring-api'
import { pick } from 'loadsh'

import { SnapAccount } from '@/StateManager'

export async function syncAccountToMetaMask(
  account: KeyringAccount
): Promise<void> {
  const listedAccounts: KeyringAccount[] = (await snap.request({
    method: 'snap_manageAccounts',
    params: {
      method: 'listAccounts',
    },
  })) as KeyringAccount[]

  // TODO 如果 snap 被删除了，此时同步到 metamask 的钱包还存在，就会出现 snap state 里无钱包，
  // 但是 metamask 中有钱包的状态

  let needUpdate = false
  if (listedAccounts && listedAccounts.length > 0) {
    needUpdate = listedAccounts.findIndex(l => l.id === account.id) > -1
  }

  if (!needUpdate) {
    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'createAccount',
        params: { account },
      },
    })
  } else {
    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'updateAccount',
        params: { account },
      },
    })
  }
}

/**
 * Approve or reject a request
 * @param id
 * @param signature
 */
export async function submitSignResponse(id: string, signature: string | null) {
  await snap.request({
    method: 'snap_manageAccounts',
    params: {
      method: 'submitResponse',
      params: { id, result: signature },
    },
  })
}

export function convertAccount(snapAccount: SnapAccount): KeyringAccount {
  return pick(snapAccount, [
    'id',
    'name',
    'address',
    'options',
    'supportedMethods',
    'type',
  ])
}
