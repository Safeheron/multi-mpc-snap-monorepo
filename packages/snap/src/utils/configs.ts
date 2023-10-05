import { KeyringAccountSupportedMethodsArray } from '@safeheron/mpcsnap-types'

export const SUPPORTED_METHODS: KeyringAccountSupportedMethodsArray = [
  'eth_sign',
  'eth_signTransaction',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'personal_sign',
]
