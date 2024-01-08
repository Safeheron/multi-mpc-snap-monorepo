import { message } from 'antd'
import copy from 'copy-to-clipboard'
import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

import { RPC_KEEPALIVE_METHOD } from '@/service/metamask'

export { ethers }

let provider: undefined | ethers.providers.Web3Provider

export function getProvider(): ethers.providers.Web3Provider {
  if (!provider) {
    // @ts-ignore
    provider = new ethers.providers.Web3Provider(window.ethereum)
  }
  return provider
}

export const wei2eth = (
  weiHex?: string,
  decimals = 18,
  fixNumber = 18
): string => {
  if (!weiHex) return '0'

  const unit = formatUnits(weiHex, decimals)

  if (+unit === 0) {
    return '0'
  }

  const int = unit.split('.')[0]
  const float = unit.split('.')[1]?.slice(0, fixNumber)
  if (float && +float === 0) {
    return toThousands(int)
  }

  return `${toThousands(int)}.${float}`
}

export const toThousands = (number: string) => {
  const isFloat = number.split('.').length > 1
  const left = number.split('.')[0]
  const right = isFloat ? number.split('.')[1] : ''
  return (
    left
      .split('')
      .reverse()
      .reduce((prev, next, index) => {
        return (index % 3 ? next : next + ',') + prev
      }) + (isFloat ? `.${right}` : '')
  )
}

export const hexToString = (hexString: string): string => {
  return ethers.utils.toUtf8String(ethers.utils.hexlify(hexString))
}

export const stringToHex = (utf8String: string): string => {
  if (!utf8String) return ''
  if (ethers.utils.isHexString(utf8String)) return utf8String
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(utf8String))
}

export async function isMetaMaskSnapsSupported() {
  try {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      return false
    }
    await window.ethereum.request({
      method: 'wallet_getSnaps',
    })
    return true
  } catch (e) {
    return false
  }
}

export const ellipsisAddress = (
  address?: string,
  leftLen = 7,
  rightLen = 9
) => {
  if (!address) return ''
  const len = address.length
  return `${address.substring(0, leftLen)}...${address.substring(
    len - rightLen
  )}`
}

export const randomFromArray = (list: string[], x: number): string[] => {
  const xList: number[] = []
  const newList = [...list]

  while (xList.length < x) {
    const r: number = Math.floor(Math.random() * list.length)
    if (!xList.includes(r)) {
      xList.push(r)
      newList[r] = ''
    }
  }

  return newList
}

/**
 * This method will be deleted after all rpc-method errors handled by each flow
 * @deprecated
 * @param error
 * @param req
 */
export async function handleSnapResponse(error, req) {
  if (req.method !== RPC_KEEPALIVE_METHOD) {
    console.error(`handleSnapResponse [${req.method}]`, error)
    message.error(error.message || error.errMsg || 'Unknown Snap Error')
  }
}

export function copyText(text: string, name: string) {
  copy(text)
  message.success(`${name} has been copied!`)
}

export const IS_PROD = process.env.IS_PROD
