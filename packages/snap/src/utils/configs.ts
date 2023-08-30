import { KeyringAccount } from '@metamask/keyring-api'

export const SUPPORTED_METHODS: KeyringAccount['supportedMethods'] = [
  'eth_sendTransaction',
  'eth_sign',
  'eth_signTransaction',
  'eth_signTypedData_v1',
  'eth_signTypedData_v2',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_signTypedData',
  'personal_sign',
]
