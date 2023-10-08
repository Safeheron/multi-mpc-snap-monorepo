import {
  emitSnapKeyringEvent,
  KeyringAccount,
  KeyringEvent,
} from '@metamask/keyring-api'
import { v4 as uuidV4 } from 'uuid'

import { SnapAccount } from '@/StateManager'
import { SUPPORTED_METHODS } from '@/utils/configs'

export async function syncAccountToMetaMask(
  account: KeyringAccount
): Promise<void> {
  await emitSnapKeyringEvent(snap, KeyringEvent.AccountCreated, { account })
  console.log('complete create or update account to metamask')
}

export function convertSnapAccountToKeyringAccount(
  snapAccount: SnapAccount
): KeyringAccount {
  return {
    id: snapAccount.id,
    address: snapAccount.address,
    methods: snapAccount.methods,
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
    methods: SUPPORTED_METHODS,
    type: 'eip155:eoa',
    backuped: false,
    pubkey: pubKey,
    signKey: signKey,
    synced: false,
  }
}
