import { getSnaps } from './snap'

/**
 *
 * @returns True if the MetaMask version is Flask, false otherwise.
 */
export const isSupportSnap = async () => {
  const provider = window.ethereum

  try {
    await provider?.request({
      method: 'wallet_getSnaps',
    })

    return true
  } catch {
    return false
  }
}
