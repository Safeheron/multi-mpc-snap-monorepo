import { KeyringSnapRpcClient } from '@metamask/keyring-api'
import type {
  AccountItem,
  ComputeMessage,
  CreateApprovalResult,
  CreateResult,
  PartialShard,
  Party,
  PartyWithZkp,
  PubAndZkp,
  PubKey,
  RecoverApprovalResult,
  RecoverContext,
  RecoverPrepare,
  RecoverResult,
  RunRoundResponse,
  SignApproval,
  SignApprovalResult,
  SignResult,
  SnapRpcResponse,
  WrappedKeyringRequest,
} from '@safeheron/mpcsnap-types'

import { snap_origin } from '@/configs/snap'
import { InvokeReqModel } from '@/service/models'
import { handleSnapResponse } from '@/utils'

const { ethereum } = window

export const RPC_KEEPALIVE_METHOD = 'mpc_snapKeepAlive'

// walletInvokeSnap
export async function walletInvokeSnap(
  req: InvokeReqModel<any>
): Promise<SnapRpcResponse<any>> {
  const params = {
    snapId: snap_origin,
    request: req,
  }
  if (req.method !== RPC_KEEPALIVE_METHOD) {
    console.debug('walletInvokeSnap request:::', req)
  }
  try {
    const res: any = await ethereum?.request({
      method: 'wallet_invokeSnap',
      params,
    })
    console.debug(
      `[wallet_invokeSnap] method: (${req.method}),  response: `,
      res
    )
    if (res.success) {
      return res
    }

    handleSnapResponse(res, req)
    return {
      success: false,
      errMsg: res.errMsg ?? `[wallet_invokeSnap](${req.method}) error`,
    }
  } catch (error) {
    handleSnapResponse(error, req)

    return {
      success: false,
      errMsg: error?.message ?? `[wallet_invokeSnap](${req.method}) error`,
    }
  }
}

// ----------------------------------
//  keyring requests
export async function keyringRejectRequestId(requestId: string) {
  const keyringClient = new KeyringSnapRpcClient(snap_origin, ethereum)
  return keyringClient.rejectRequest(requestId)
}

// ----------------------------------
//  Custom RPC Requests

export async function listKeyringRequests(): Promise<
  SnapRpcResponse<WrappedKeyringRequest[]>
> {
  return walletInvokeSnap({ method: 'internal_listPendingRequests' })
}

export async function remindUserAfterFirstInstall() {
  return walletInvokeSnap({
    method: 'internal_firstInstallRemainder',
  })
}

export async function requestAccount(): Promise<SnapRpcResponse<AccountItem>> {
  return walletInvokeSnap({ method: 'mpc_requestAccount' })
}

export async function checkMnemonic(
  walletName: string
): Promise<SnapRpcResponse<string>> {
  return walletInvokeSnap({
    method: 'mpc_checkMnemonic',
    params: {
      walletName,
    },
  })
}

export async function backupApproval(
  walletName: string
): Promise<SnapRpcResponse<{ sessionId: string; mnemonic: string }>> {
  return walletInvokeSnap({
    method: 'mpc_backupApproval',
    params: {
      walletName,
    },
  })
}

export async function backupUpdate(
  sessionId: string
): Promise<SnapRpcResponse<AccountItem>> {
  return walletInvokeSnap({
    method: 'mpc_backupUpdate',
    params: {
      sessionId,
    },
  })
}

export async function createApproval(
  walletName: string,
  party: Party
): Promise<SnapRpcResponse<CreateApprovalResult>> {
  return walletInvokeSnap({
    method: 'mpc_createApproval',
    params: { walletName, party },
  })
}

export async function createContext(
  sessionId: string,
  remoteParties: Party[]
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  return walletInvokeSnap({
    method: 'mpc_createContext',
    params: { sessionId, remoteParties },
  })
}

export async function createRound(
  sessionId: string,
  messages: ComputeMessage[]
): Promise<SnapRpcResponse<RunRoundResponse | CreateResult>> {
  return walletInvokeSnap({
    method: 'mpc_createRound',
    params: { sessionId, messages },
  })
}

export async function createSuccess(
  sessionId: string
): Promise<SnapRpcResponse<AccountItem>> {
  return walletInvokeSnap({
    method: 'mpc_createSuccess',
    params: { sessionId },
  })
}

export async function signApproval(
  method: SignApproval['params']['method'],
  params: Record<string, unknown>,
  requestId?: string
): Promise<SnapRpcResponse<SignApprovalResult>> {
  return walletInvokeSnap({
    method: 'mpc_signApproval',
    params: { method, params, requestId },
  })
}

export async function signContext(
  sessionId: string,
  partyIds: string[],
  remotePub: { partyId: string; pub: string }
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  return walletInvokeSnap({
    method: 'mpc_signContext',
    params: { sessionId, partyIds, remotePub },
  })
}

export async function signRound(
  sessionId: string,
  messages: ComputeMessage[]
): Promise<SnapRpcResponse<RunRoundResponse | SignResult>> {
  return walletInvokeSnap({
    method: 'mpc_signRound',
    params: { sessionId, messages },
  })
}

export async function recoverApproval(
  walletName?: string
): Promise<SnapRpcResponse<RecoverApprovalResult>> {
  return walletInvokeSnap({
    method: 'mpc_recoverApproval',
    params: {
      walletName,
    },
  })
}

export async function recoverPrepare(
  sessionId: string,
  walletName: string,
  remotePubs: RecoverPrepare['params']['remotePubs'],
  mnemonic?: string
): Promise<SnapRpcResponse<any>> {
  return walletInvokeSnap({
    method: 'mpc_recoverPrepare',
    params: {
      sessionId,
      walletName,
      remotePubs,
      mnemonic,
    },
  })
}

export async function recoverContext(
  sessionId: string,
  localParty: RecoverContext['params']['localParty'],
  remoteParty: RecoverContext['params']['remoteParty'],
  lostParty: RecoverContext['params']['lostParty']
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  const params: RecoverContext['params'] = {
    sessionId,
    localParty,
    remoteParty,
    lostParty,
  }
  return walletInvokeSnap({
    method: 'mpc_recoverContext',
    params,
  })
}

export async function recoverRound(
  sessionId: string,
  messages: ComputeMessage[]
): Promise<SnapRpcResponse<RunRoundResponse | RecoverResult>> {
  return walletInvokeSnap({
    method: 'mpc_recoverRound',
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
    method: 'mpc_recoverMnemonic',
    params: {
      sessionId,
      partialShards,
      X,
      remotePubKeys,
    },
  })
}

export async function refreshPrepare(
  sessionId: string
): Promise<SnapRpcResponse<PubAndZkp>> {
  return walletInvokeSnap({
    method: 'mpc_refreshPrepare',
    params: {
      sessionId,
    },
  })
}

export async function refreshContext(
  sessionId: string,
  localParty: Party,
  remoteParties: PartyWithZkp[]
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  return walletInvokeSnap({
    method: 'mpc_refreshContext',
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
    method: 'mpc_refreshRound',
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
    method: 'mpc_refreshSuccess',
    params: {
      sessionId,
    },
  })
}

export async function syncAccountToMetamask() {
  return walletInvokeSnap({
    method: 'mpc_syncAccount',
  })
}
