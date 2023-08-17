import {
  SignTypedDataVersion,
  TypedDataUtils,
  TypedDataV1,
  TypedMessage,
  typedSignatureHash,
} from '@metamask/eth-sig-util'
import {
  KeyringAccountSupportedMethods,
  TransactionObject,
} from '@safeheron/mpcsnap-types'
import { ethers } from 'ethers'
import { isHexString } from 'ethers/lib/utils'

import { normalizeTx } from '@/utils/transactionUtil'

export function serialize(
  method: KeyringAccountSupportedMethods,
  params: Record<string, any> | string
) {
  switch (method) {
    case 'eth_signTransaction':
      return serializeTransaction(params as TransactionObject)
    case 'eth_sign':
      return serializeRawMessage(params as string)
    case 'personal_sign':
      return serializePersonalMessage(params as string)
    case 'eth_signTypedData_v1':
      return serializeTypedData(SignTypedDataVersion.V1, params)
    case 'eth_signTypedData_v3':
      return serializeTypedData(SignTypedDataVersion.V3, params)
    case 'eth_signTypedData_v4':
      return serializeTypedData(SignTypedDataVersion.V4, params)
    default:
      throw new Error('Unsupported request serialize method')
  }
}

function serializeTransaction(params: TransactionObject) {
  const serializedTransaction = ethers.utils.serializeTransaction(
    normalizeTx(params)
  )
  let unsignedTxHash = ethers.utils.keccak256(serializedTransaction)
  if (unsignedTxHash.startsWith('0x')) {
    unsignedTxHash = unsignedTxHash.substring(2)
  }
  return unsignedTxHash
}

function serializeRawMessage(rawMessage: string) {
  return stripHexPrefix(rawMessage)
}

function serializePersonalMessage(personalMessage: string) {
  const rawPersonalMessage = isHexString(personalMessage)
    ? msgHexToText(personalMessage)
    : personalMessage
  return stripHexPrefix(ethers.utils.hashMessage(rawPersonalMessage))
}

function serializeTypedData(version: SignTypedDataVersion, typedMessage) {
  let hash = ''

  if (version === 'V3') {
    hash = TypedDataUtils.eip712Hash(
      typedMessage as TypedMessage<any>,
      SignTypedDataVersion.V3
    ).toString('hex')
  } else if (version === 'V4') {
    hash = TypedDataUtils.eip712Hash(
      typedMessage as TypedMessage<any>,
      SignTypedDataVersion.V4
    ).toString('hex')
  } else {
    hash = typedSignatureHash(typedMessage as TypedDataV1)
  }

  return stripHexPrefix(hash)
}

function stripHexPrefix(str: string) {
  return isHexPrefixed(str) ? str.slice(2) : str
}

function isHexPrefixed(str: string): boolean {
  return str[0] === '0' && str[1] === 'x'
}

function msgHexToText(hex: string) {
  try {
    const stripped = stripHexPrefix(hex)
    const buff = Buffer.from(stripped, 'hex')
    return buff.length === 32 ? hex : buff.toString('utf8')
  } catch (e) {
    return hex
  }
}
