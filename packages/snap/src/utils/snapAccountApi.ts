import {
  emitSnapKeyringEvent,
  KeyringAccount,
  KeyringEvent,
} from '@metamask/keyring-api'
import { AccountItem } from '@safeheron/mpcsnap-types'
import { Buffer } from 'buffer'
import { sha256 } from 'ethers/lib/utils'
import { v4 as uuidV4 } from 'uuid'

import { SnapAccount } from '@/StateManager'
import { SUPPORTED_METHODS } from '@/utils/configs'

export async function syncAccountToMetaMask(
  account: KeyringAccount
): Promise<void> {
  console.debug(
    'start emit create account event to metamask',
    JSON.stringify(account)
  )
  await emitSnapKeyringEvent(snap, KeyringEvent.AccountCreated, { account })
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

export function convertPlainAccount(snapAccount: SnapAccount): AccountItem {
  return {
    id: snapAccount.walletId,
    walletName: snapAccount.name,
    address: snapAccount.address,
    backuped: snapAccount.backuped,
    synced: snapAccount.synced,
  }
}

export function newSnapAccount(
  walletId: string,
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
    walletId,
  }
}

export function genWalletId(sessionId: string, address: string) {
  return sha256(Buffer.from(sessionId + '-' + address.toLowerCase()))
}
