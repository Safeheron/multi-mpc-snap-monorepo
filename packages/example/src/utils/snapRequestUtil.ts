import { EthMethod, KeyringRequest } from '@metamask/keyring-api'
import { TypedDataDomain } from 'ethers'

export function tryToExtractChainId(
  method: EthMethod,
  params: KeyringRequest['request']['params']
): string {
  let chainId = ''
  try {
    switch (method) {
      case 'eth_signTransaction':
        const [tx] = params as [any]
        chainId = tx.chainId
        break
      case EthMethod.SignTypedDataV3:
      case EthMethod.SignTypedDataV4:
        const [from, data] = params as [string, any]
        chainId = data.domain.chainId
        break
    }
  } catch (e) {
    console.warn('extract chainId error: ', e)
  }
  return chainId
}

export function convertRequestTitle(rpcRequest: KeyringRequest['request']) {
  let title = ''
  const method = rpcRequest.method as EthMethod
  switch (method) {
    case 'eth_signTransaction':
      title = 'Send Transaction'
      break
    case 'eth_sign':
    case 'personal_sign':
      title = 'Request for signature'
      break
    case EthMethod.SignTypedDataV1:
      title = 'Request for signature'
      break
    case EthMethod.SignTypedDataV3:
    case EthMethod.SignTypedDataV4:
      const domain = rpcRequest.params![1].domain as TypedDataDomain
      title = domain.name || 'Request for signature'
      break
    default:
      title = 'Unsupported Request Type'
  }
  return title
}
