import { getSnaps } from './snap'

/**
 *
 * @returns True if the MetaMask version is Flask, false otherwise.
 */
export const isSupportSnap = async () => {
  const provider = window.ethereum

  if (!provider) return false

  try {
    await provider?.request({
      method: 'wallet_getSnaps',
    })

    return true
  } catch (e) {
    console.error('detect snap compatible error: ', e)
    return false
  }
}
