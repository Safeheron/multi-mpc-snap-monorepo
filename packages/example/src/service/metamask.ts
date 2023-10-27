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
  RecoverResult,
  RecoverSetRemoteCommunicationPubs,
  RunRoundResponse,
  SignApproval,
  SignApprovalResult,
  SignResult,
  SnapRpcResponse,
  WrappedKeyringRequest,
} from '@safeheron/mpcsnap-types'

import { SnapInvokeMethods } from '@/configs/Enums'
import { snap_origin } from '@/configs/snap'
import { InvokeReqModel } from '@/service/models'
import { handleSnapResponse } from '@/utils'

const { ethereum } = window

const keyringClient = new KeyringSnapRpcClient(snap_origin, ethereum)

// walletInvokeSnap
export async function walletInvokeSnap(req: InvokeReqModel<any>): Promise<any> {
  const params = {
    snapId: snap_origin,
    request: req,
  }
  if (req.method !== 'mpc_snapKeepAlive') {
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
    }
  } catch (error) {
    handleSnapResponse(error, req)

    return {
      success: false,
    }
  }
}

// ----------- keyring request --------------
export async function listKeyringRequests(): Promise<
  SnapRpcResponse<WrappedKeyringRequest[]>
> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.listPendingRequests,
  })
}

export async function remindUserAfterFirstInstall() {
  return walletInvokeSnap({
    method: SnapInvokeMethods.remindAfterInstall,
  })
}

export async function keyringRejectRequestId(requestId: string) {
  return keyringClient.rejectRequest(requestId)
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
): Promise<SnapRpcResponse<CreateApprovalResult>> {
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
  method: SignApproval['params']['method'],
  params: Record<string, unknown>,
  requestId?: string
): Promise<SnapRpcResponse<SignApprovalResult>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.signApproval,
    params: { method, params, requestId },
  })
}

export async function signContext(
  sessionId: string,
  partyIds: string[],
  remotePub: { partyId: string; pub: string }
): Promise<SnapRpcResponse<ComputeMessage[]>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.signContext,
    params: { sessionId, partyIds, remotePub },
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
): Promise<SnapRpcResponse<RecoverApprovalResult>> {
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
  mnemonic?: string
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

export async function recoverSetCommunicationPub(
  remotePubs: RecoverSetRemoteCommunicationPubs['params']
) {
  return walletInvokeSnap({
    method: SnapInvokeMethods.setCommunicationPubs,
    params: remotePubs,
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
    method: SnapInvokeMethods.recoverContext,
    params,
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
  sessionId: string
): Promise<SnapRpcResponse<PubAndZkp>> {
  return walletInvokeSnap({
    method: SnapInvokeMethods.refreshPrepare,
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

export async function syncAccountToMetamask() {
  return walletInvokeSnap({
    method: SnapInvokeMethods.syncAccount,
  })
}
