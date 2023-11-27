import { GetSnapsResponse, Snap } from '@/@types/snap'
import { snap_origin, snap_version } from '@/configs/snap'
import { RPC_KEEPALIVE_METHOD } from '@/service/metamask'

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask provider.
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (
  provider?: Window['ethereum']
): Promise<GetSnapsResponse> =>
  (await (provider ?? window.ethereum).request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = snap_origin,
  params: Record<'version' | string, unknown> = {}
) => {
  params = Object.assign({}, { version: snap_version }, params)

  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  })
}

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (
  version: string = snap_version
): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps()

    return Object.values(snaps).find(
      snap => snap.id === snap_origin && (!version || snap.version === version)
    )
  } catch (e) {
    console.log('Failed to obtain installed snap', e)
    return undefined
  }
}

export const keepalive = async () => {
  console.debug('heartbeat start...')
  await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: snap_origin, request: { method: RPC_KEEPALIVE_METHOD } },
  })
  console.debug('heartbeat end')
}

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:')
