import { KeyringAccount, KeyringRequest } from '@metamask/keyring-api'

export type KeyringAccountSupportedMethodsArray = KeyringAccount['methods']

export type KeyringAccountSupportedMethods =
  KeyringAccountSupportedMethodsArray[number]

export type WrappedKeyringRequest = {
  createTime: number
  request: KeyringRequest
}
