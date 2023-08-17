import { KeyringSnapRpcClient } from '@metamask/keyring-api'
import type {
  AccountItem,
  ComputeMessage,
  CreateResult,
  PartialShard,
  Party,
  PartyWithZkp,
  PubAndZkp,
  PubKey,
  RecoverResult,
  RunRoundResponse,
  SignResult,
  SnapRpcResponse,
} from '@safeheron/mpcsnap-types'

import { SnapInvokeMethods } from '@/configs/Enums'
import { InvokeReqModel } from '@/service/models'
import { handleSnapResponse, IS_PROD } from '@/utils'

export const SNAP_ID = IS_PROD
  ? 'npm:@safeheron/mpc-snap'
  : 'local:http://localhost:4100'

const { ethereum } = window

const keyringClient = new KeyringSnapRpcClient(SNAP_ID, ethereum)

export async function connect() {
  try {
    const result: any = await ethereum?.request({
      method: 'wallet_requestSnaps',
      params: {
        [SNAP_ID]: {},
      },
    })

    if (result) {
      const info = result[SNAP_ID]
      console.log('snap info', info)

      if (info.error) {
        return {
          success: false,
          message: info.error.message,
        }
      } else {
        return {
          success: true,
        }
      }
    } else {
      return { success: false }
    }
  } catch (error) {
    console.error('connect error', error)

    return {
      success: false,
      message: error.message,
    }
  }
}

export async function getSnaps() {
  return ethereum?.request<{ [key: string]: { enabled: boolean } }>({
    method: 'wallet_getSnaps',
  })
}

// walletInvokeSnap
export async function walletInvokeSnap(req: InvokeReqModel<any>): Promise<any> {
  const params = {
    snapId: SNAP_ID,
    request: req,
  }
  if (req.method !== 'mpc_snapKeepAlive') {
    console.log('walletInvokeSnap:::', req)
  }
  try {
    const res: any = await ethereum?.request({
      method: 'wallet_invokeSnap',
      params,
    })
    if (res.success) {
      return res
    }

    handleSnapResponse(res, req)
    return {
      success: false,
    }
  } catch (error) {
    console.error(error)
    handleSnapResponse(error, req)

    return {
      success: false,
    }
  }
}

// ----------- keyring request --------------

export async function listKeyringRequests() {
  return keyringClient.listRequests()
}

// ping
export async function heartBeat(): Promise<SnapRpcResponse<any>> {
  return await walletInvokeSnap({
    method: SnapInvokeMethods.heartBeat,
  })
}

export async function requestAccount(): Promise<SnapRpcResponse<AccountItem>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.requestAccount,
  })
}

export async function deleteWallet(): Promise<SnapRpcResponse<any>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.deleteWallet,
  })
}

export async function checkMnemonic(
  walletName: string
): Promise<SnapRpcResponse<any>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.checkMnemonic,
    params: {
      walletName,
    },
  })
}

export async function backupApproval(
  walletName: string
): Promise<SnapRpcResponse<{ sessionId: string; mnemonic: string }>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.backupApproval,
    params: {
      walletName,
    },
  })
}

export async function backupUpdate(
  sessionId: string
): Promise<SnapRpcResponse<AccountItem>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.backupUpdate,
    params: {
      sessionId,
    },
  })
}

export async function createApproval(
  walletName: string,
  party: Party
): Promise<SnapRpcResponse<string>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.createApproval,
    params: { walletName, party },
  })
}

export async function createContext(
  sessionId: string,
  remoteParties: Party[]
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.createContext,
    params: { sessionId, remoteParties },
  })
}

export async function createRound(
  sessionId: string,
  messages: ComputeMessage[]
): Promise<SnapRpcResponse<RunRoundResponse | CreateResult>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.createRound,
    params: { sessionId, messages },
  })
}

export async function createSuccess(
  sessionId: string
): Promise<SnapRpcResponse<AccountItem>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.createSuccess,
    params: { sessionId },
  })
}

export async function signApproval(
  transactionObject: Record<string, unknown>
): Promise<SnapRpcResponse<any>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.signApproval,
    params: { transactionObject },
  })
}

export async function signContext(
  sessionId: string,
  partyIds: string[]
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.signContext,
    params: { sessionId, partyIds },
  })
}

export async function signRound(
  sessionId: string,
  messages: ComputeMessage[]
): Promise<SnapRpcResponse<RunRoundResponse | SignResult>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.signRound,
    params: { sessionId, messages },
  })
}

export async function recoverApproval(
  walletName?: string
): Promise<SnapRpcResponse<{ sessionId: string; mnemonic: string }>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.recoverApproval,
    params: {
      walletName,
    },
  })
}

export async function recoverPrepare(
  sessionId: string,
  walletName: string,
  mnemonic: string
): Promise<SnapRpcResponse<any>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.recoverPrepare,
    params: {
      sessionId,
      walletName,
      mnemonic,
    },
  })
}

export async function createKeyPair(
  sessionId: string
): Promise<SnapRpcResponse<string>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.recoverKeyPair,
    params: {
      sessionId,
    },
  })
}

export async function recoverContext(
  sessionId: string,
  partyInfo: {
    localPartyIndex: string
    remotePartyIndex: string
    lostPartyIndex: string
  },
  remotePub: string
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.recoverContext,
    params: {
      sessionId,
      partyInfo,
      remotePub,
    },
  })
}

export async function recoverRound(
  sessionId: string,
  messages: ComputeMessage[]
): Promise<SnapRpcResponse<RunRoundResponse | RecoverResult>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.recoverRound,
    params: {
      sessionId,
      messages,
    },
  })
}

export async function recoverMnemonic(
  sessionId: string,
  partialShards: PartialShard[],
  X: string,
  remotePubKeys: PubKey[]
): Promise<SnapRpcResponse<string>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.recoverMnemonic,
    params: {
      sessionId,
      partialShards,
      X,
      remotePubKeys,
    },
  })
}

export async function refreshPrepare(
  sessionId: string,
  mnemonic: string,
  walletName: string
): Promise<SnapRpcResponse<PubAndZkp>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.refreshPrepare,
    params: {
      sessionId,
      mnemonic,
      walletName,
    },
  })
}

export async function refreshContext(
  sessionId: string,
  localParty: Party,
  remoteParties: PartyWithZkp[]
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.refreshContext,
    params: {
      sessionId,
      localParty,
      remoteParties,
    },
  })
}

export async function refreshRound(
  sessionId: string,
  messages: ComputeMessage[]
): Promise<SnapRpcResponse<RunRoundResponse>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.refreshRound,
    params: {
      sessionId,
      messages,
    },
  })
}

export async function refreshSuccess(
  sessionId: string
): Promise<SnapRpcResponse<AccountItem>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.refreshSuccess,
    params: {
      sessionId,
    },
  })
}

export async function test() {
  return walletInvokeSnap({
    method: SnapInvokeMethods.test,
  })
}
