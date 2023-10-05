import {
  Eip1559Params,
  LegacyParams,
  TransactionBaseParams,
  TransactionObject,
} from '@safeheron/mpcsnap-types'
import { ethers } from 'ethers'
import { formatEther } from 'ethers/lib/utils'

export type HumanableTransaction = TransactionObject

/**
 * For Screen
 * @param transaction
 */
export function convertToHumanableTx(
  transaction: TransactionObject
): HumanableTransaction {
  const { to, nonce, value, chainId, data, gasLimit, type, ...specialProp } =
    transaction
  const baseTx: TransactionBaseParams = {
    to,
    data,
    nonce: isHexPrefixed(nonce) ? hexStringToString(nonce) : nonce,
    value: isHexPrefixed(value) ? formatEther(value) : value,
    chainId: isHexPrefixed(chainId) ? hexStringToString(chainId) : chainId,
    gasLimit: isHexPrefixed(gasLimit) ? hexStringToString(gasLimit) : gasLimit,
  }

  if (type === 2) {
    const { maxFeePerGas, maxPriorityFeePerGas } = transaction
    return {
      ...baseTx,
      type,
      maxFeePerGas: isHexPrefixed(maxFeePerGas)
        ? hexStringToString(maxFeePerGas)
        : maxFeePerGas,
      maxPriorityFeePerGas: isHexPrefixed(maxPriorityFeePerGas)
        ? hexStringToString(maxPriorityFeePerGas)
        : maxPriorityFeePerGas,
    }
  } else {
    const { gasPrice } = transaction

    return {
      ...baseTx,
      type,
      gasPrice: isHexPrefixed(gasPrice)
        ? hexStringToString(gasPrice)
        : gasPrice,
    }
  }
}

export type NormalizedTransaction = Omit<
  TransactionObject,
  'nonce' | 'chainId'
> & {
  nonce: number
  chainId: number
}

/**
 * For Serialize
 * @param transaction
 */
export function normalizeTx(
  transaction: TransactionObject
): NormalizedTransaction {
  const { to, nonce, value, chainId, data, gasLimit, type } = transaction
  const baseTx: Omit<TransactionBaseParams, 'nonce' | 'chainId'> & {
    nonce: number
    chainId: number
  } = {
    to,
    nonce: strToNumber(nonce),
    chainId: strToNumber(chainId),
    value: isHexPrefixed(value) ? value : numberToHexString(value),
    data: isHexString(data)
      ? data
      : ethers.utils.hexlify(ethers.utils.toUtf8Bytes(`${data}`)),
    gasLimit: isHexPrefixed(gasLimit) ? gasLimit : numberToHexString(gasLimit),
  }

  let specialTxParams: LegacyParams | Eip1559Params

  if (type === 2) {
    const { maxFeePerGas, maxPriorityFeePerGas, accessList } = transaction
    specialTxParams = {
      type,
      maxFeePerGas: isHexPrefixed(maxFeePerGas)
        ? maxFeePerGas
        : numberToHexString(maxFeePerGas),
      maxPriorityFeePerGas: isHexPrefixed(maxPriorityFeePerGas)
        ? maxPriorityFeePerGas
        : numberToHexString(maxPriorityFeePerGas),
      accessList,
    } as Eip1559Params
  } else {
    const { gasPrice } = transaction
    specialTxParams = {
      type,
      gasPrice: isHexPrefixed(gasPrice)
        ? gasPrice
        : numberToHexString(gasPrice),
    } as LegacyParams
  }

  return {
    ...baseTx,
    ...specialTxParams,
  }
}

/**
 * serialized result for metamask
 * @param tx
 */
export function trimNullableProperty(tx: Record<string, any>) {
  const serializedSignedTx = { ...tx }

  // Make tx serializable
  // toJSON does not remove undefined or convert undefined to null
  Object.entries(serializedSignedTx).forEach(([key, _]) => {
    if (serializedSignedTx[key] === undefined) {
      delete serializedSignedTx[key]
    }
  })

  return serializedSignedTx
}

function strToNumber(value: string): number {
  return ethers.BigNumber.from(value).toNumber()
}

function hexStringToString(value: string): string {
  return ethers.BigNumber.from(value).toString()
}

function numberToHexString(value: string): string {
  return ethers.BigNumber.from(value).toHexString()
}

export function stripHexPrefix(str: string) {
  return isHexPrefixed(str) ? str.slice(2) : str
}

export function isHexPrefixed(str: string): boolean {
  return str[0] === '0' && str[1] === 'x'
}

export function isHexString(value: string) {
  return ethers.utils.isHexString(value)
}
