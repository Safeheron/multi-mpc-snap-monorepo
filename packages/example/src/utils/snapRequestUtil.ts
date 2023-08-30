import { KeyringRequest } from '@metamask/keyring-api'

export function tryToExtractChainId(
  method: KeyringRequest['request']['method'],
  params: any
): string {
  let chainId = ''
  try {
    switch (method) {
      case 'eth_signTransaction':
      case 'eth_sendTransaction':
        chainId = params.chainId
        break
      case 'eth_signTypedData':
        chainId = Array.isArray(params) ? '' : params.domain.chainId
        break
    }
  } catch (e) {
    console.warn('extract chainId error: ', e)
  }
  return chainId
}
