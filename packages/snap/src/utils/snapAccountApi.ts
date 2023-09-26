import { KeyringAccount } from '@metamask/keyring-api'
import { pick } from 'loadsh'
import { v4 as uuidV4 } from 'uuid'

import { SnapAccount } from '@/StateManager'
import { SUPPORTED_METHODS } from '@/utils/configs'

export async function syncAccountToMetaMask(
  account: KeyringAccount
): Promise<void> {
  const listedAccounts: KeyringAccount[] = (await snap.request({
    method: 'snap_manageAccounts',
    params: {
      method: 'listAccounts',
    },
  })) as KeyringAccount[]

  console.log('snap list accounts >>', listedAccounts)

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

  console.log('complete create or update account to metamask')
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

export function convertSnapAccountToKeyringAccount(
  snapAccount: SnapAccount
): KeyringAccount {
  return {
    id: snapAccount.id,
    name: snapAccount.name,
    address: snapAccount.address,
    supportedMethods: snapAccount.supportedMethods,
    type: snapAccount.type,
    options: snapAccount.options,
  }
}

export function newSnapAccount(
  name: string,
  address: string,
  pubKey: string,
  signKey: string
): SnapAccount {
  return {
    id: uuidV4(),
    name,
    address,
    options: {},
    supportedMethods: SUPPORTED_METHODS,
    type: 'eip155:eoa',
    backuped: false,
    pubkey: pubKey,
    signKey: signKey,
  }
}
