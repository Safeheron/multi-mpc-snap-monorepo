import {
  handleKeyringRequest,
  MethodNotSupportedError,
} from '@metamask/keyring-api'
import { OnRpcRequestHandler } from '@metamask/snaps-types'
import { MPC } from '@safeheron/mpc-wasm-sdk'
import {
  BackupApprovalStruct,
  BackupUpdateStruct,
  CheckMnemonicStruct,
  CreateApprovalStruct,
  CreateContextStruct,
  CreateRoundStruct,
  CreateSuccessStruct,
  RecoverContextStruct,
  RecoverMnemonicStruct,
  RecoverPrepareStruct,
  RecoverRoundStruct,
  RefreshContextStruct,
  RefreshPrepareStruct,
  RefreshRoundStruct,
  RefreshSuccessStruct,
  SignApprovalStruct,
  SignContextStruct,
  SignRoundStruct,
} from '@safeheron/mpcsnap-types'
import { assert } from 'superstruct'

import BackupFlow from '@/mpc-flow/BackupFlow'
import KeyGenFlow from '@/mpc-flow/KeyGenFlow'
import RecoveryFlow from '@/mpc-flow/RecoveryFlow'
import SignerFlow from '@/mpc-flow/SignerFlow'
import {
  checkMnemonic,
  requestAccount,
  syncAccount,
} from '@/mpc-flow/walletManage'
import { listPendingRequests } from '@/rpc/internalKeyringHandler'
import { MPCKeyring } from '@/rpc/MPCKeyring'
import { onSnapInstallRemainder } from '@/rpc/onSnapInstallRemainder'
import {
  InternalMPCOtherMethods,
  InternalMPCRecoveryMethods,
} from '@/rpc/permissions'
import StateManager from '@/StateManager'

let stateManager: StateManager
let mpcInstance: MPC
let backupFlow: BackupFlow
let keygenFlow: KeyGenFlow
let signFlow: SignerFlow
let recoveryFlow: RecoveryFlow
let mpcKeyring: MPCKeyring

export const setup = async () => {
  if (!mpcInstance) {
    console.log('init mpc instance...')
    mpcInstance = await MPC.init()
  }

  if (!stateManager) {
    console.log('init stateManager...')
    const tmpStateManager = new StateManager()
    await tmpStateManager.loadState()
    stateManager = tmpStateManager
  }
}

/**
 * Backup-related methods
 * @param request
 */
export const backupHandler: OnRpcRequestHandler = async ({ request }) => {
  if (!backupFlow) {
    console.log('init backup mpc-flow instance...')
    backupFlow = new BackupFlow(stateManager, mpcInstance)
  }

  switch (request.method) {
    case 'mpc_backupApproval':
      assert(request, BackupApprovalStruct)
      return backupFlow.backupApproval(request.params.walletName)

    case 'mpc_backupUpdate':
      assert(request, BackupUpdateStruct)
      return backupFlow.finishBackup(request.params.sessionId)
    default:
      throw new MethodNotSupportedError(request.method)
  }
}

/**
 * create wallet
 * @param request
 */
export const keygenHandler: OnRpcRequestHandler = async ({ request }) => {
  if (!keygenFlow) {
    console.log('init keygen mpc-flow instance...')
    keygenFlow = new KeyGenFlow(stateManager, mpcInstance)
  }
  switch (request.method) {
    case 'mpc_createApproval':
      assert(request, CreateApprovalStruct)
      return keygenFlow.keyGenApproval(
        request.params.walletName,
        request.params.party
      )
    case 'mpc_createContext':
      assert(request, CreateContextStruct)
      return keygenFlow.createContext(
        request.params.sessionId,
        request.params.remoteParties
      )

    case 'mpc_createRound':
      assert(request, CreateRoundStruct)
      return keygenFlow.runRound(
        request.params.sessionId,
        request.params.messages
      )

    case 'mpc_createSuccess':
      assert(request, CreateSuccessStruct)
      return keygenFlow.createWalletSuccess(request.params.sessionId)

    default:
      throw new MethodNotSupportedError(request.method)
  }
}

/**
 * mpc sign
 * @param request
 */
export const signHandler: OnRpcRequestHandler = async ({ request }) => {
  if (!signFlow) {
    signFlow = new SignerFlow(stateManager, mpcInstance)
  }

  switch (request.method) {
    case 'mpc_signApproval':
      assert(request, SignApprovalStruct)
      const { method, params, requestId } = request.params
      return signFlow.signApproval(method, params, requestId)

    case 'mpc_signContext':
      assert(request, SignContextStruct)
      return signFlow.createContext(
        request.params.sessionId,
        request.params.partyIds,
        request.params.remotePub
      )

    case 'mpc_signRound':
      assert(request, SignRoundStruct)
      return signFlow.runRound(
        request.params.sessionId,
        request.params.messages
      )
    default:
      throw new MethodNotSupportedError(request.method)
  }
}

/**
 * mpc recovery
 * @param request
 */
export const recoverHandler: OnRpcRequestHandler = async ({ request }) => {
  if (!recoveryFlow) {
    recoveryFlow = new RecoveryFlow(stateManager, mpcInstance)
  }
  switch (request.method) {
    case 'mpc_recoverApproval':
      return recoveryFlow.recoverApproval()

    case 'mpc_recoverPrepare':
      assert(request, RecoverPrepareStruct)
      const { sessionId, walletName, remotePubs, mnemonic } = request.params

      return recoveryFlow.recoverPrepare(
        sessionId,
        walletName,
        remotePubs,
        mnemonic
      )

    case 'mpc_recoverContext':
      assert(request, RecoverContextStruct)
      return recoveryFlow.recoverContext(
        request.params.sessionId,
        request.params.localParty,
        request.params.remoteParty,
        request.params.lostParty
      )

    case 'mpc_recoverRound':
      assert(request, RecoverRoundStruct)
      return recoveryFlow.recoverRound(
        request.params.sessionId,
        request.params.messages
      )

    case 'mpc_recoverMnemonic':
      assert(request, RecoverMnemonicStruct)
      return recoveryFlow.generateMnemonic(
        request.params.sessionId,
        request.params.partialShards,
        request.params.X,
        request.params.remotePubKeys
      )
    case 'mpc_refreshPrepare':
      assert(request, RefreshPrepareStruct)
      return recoveryFlow.refreshPrepare(request.params.sessionId)

    case 'mpc_refreshContext':
      assert(request, RefreshContextStruct)
      return recoveryFlow.refreshContext(
        request.params.sessionId,
        request.params.localParty,
        request.params.remoteParties
      )

    case 'mpc_refreshRound':
      assert(request, RefreshRoundStruct)
      return recoveryFlow.refreshRound(
        request.params.sessionId,
        request.params.messages
      )

    case 'mpc_refreshSuccess':
      assert(request, RefreshSuccessStruct)
      return recoveryFlow.refreshSuccess(request.params.sessionId)

    default:
      throw new MethodNotSupportedError(request.method)
  }
}

export const otherHandlers: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'mpc_snapKeepAlive':
      return 'lived'

    case 'mpc_requestAccount':
      return requestAccount(stateManager)

    case 'mpc_checkMnemonic':
      assert(request, CheckMnemonicStruct)
      return checkMnemonic(request.params.walletName, stateManager, mpcInstance)

    case 'mpc_syncAccount':
      return syncAccount(stateManager)

    case 'internal_listPendingRequests':
      return listPendingRequests(stateManager)

    case InternalMPCOtherMethods.RemindAfterFirstInstall:
      return onSnapInstallRemainder()

    default:
      throw new MethodNotSupportedError(request.method)
  }
}

export const keyringHandler: OnRpcRequestHandler = async ({ request }) => {
  if (!mpcKeyring) {
    mpcKeyring = new MPCKeyring(stateManager)
  }
  return handleKeyringRequest(mpcKeyring, request)
}
