import { KeyringAccount } from '@metamask/keyring-api'

export type KeyringAccountSupportedMethodsArray =
  KeyringAccount['supportedMethods']

export type KeyringAccountSupportedMethods =
  KeyringAccountSupportedMethodsArray[number]
