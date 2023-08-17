import { KeyringAccount } from '@metamask/keyring-api'
import { pick } from 'loadsh'

import { SnapAccount } from '@/StateManager'

export async function addAccount(account: KeyringAccount) {
  return await snap.request({
    method: 'snap_manageAccounts',
    params: {
      method: 'createAccount',
      params: { account },
    },
  })
}

export async function submitSignResponse(id: string, signature: string) {
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
