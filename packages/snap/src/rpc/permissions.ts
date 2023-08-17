import { MethodNotSupportedError } from '@metamask/keyring-api'
import { OnRpcRequestHandler } from '@metamask/snaps-types'

enum SnapKeyringAccountMethods {
  ListAccounts = 'keyring_listAccounts',
  CreateAccount = 'keyring_createAccount',
  GetAccount = 'keyring_getAccount',
  UpdateAccount = 'keyring_updateAccount',
  DeleteAccount = 'keyring_deleteAccount',
  ExportAccount = 'keyring_exportAccount',
}

enum SnapKeyringRequestMethods {
  GetRequest = 'keyring_getRequest',
  SubmitRequest = 'keyring_submitRequest',
  ListRequests = 'keyring_listRequests',
  DeleteRequest = 'keyring_deleteRequest',
  ApproveRequest = 'keyring_approveRequest',
  RejectRequest = 'keyring_rejectRequest',
}

enum InternalSnapCommonMethods {
  KeepAlive = 'mpc_snapKeepAlive',
}

enum InternalMPCAccountMethods {
  ListAccounts = 'mpc_requestAccount',
  DeleteAccount = 'mpc_deleteWallet',
  ApprovalCreateAccount = 'mpc_createApproval',
  CreateAccountContext = 'mpc_createContext',
  CreateAccountRound = 'mpc_createRound',
  CreateAccountDone = 'mpc_createSuccess',
}

enum InternalMPCSignMethods {
  ApprovalSign = 'mpc_signApproval',
  SignContext = 'mpc_signContext',
  SignRound = 'mpc_signRound',
}

enum InternalMPCRecoveryMethods {
  ApprovalRecovery = 'mpc_recoverApproval',
  RecoveryPrepare = 'mpc_recoverPrepare',
  RecoveryKeyPair = 'mpc_recoverKeyPair',
  RecoveryContext = 'mpc_recoverContext',
  RecoveryRound = 'mpc_recoverRound',
  RecoveryMnemonic = 'mpc_recoverMnemonic',
}

enum InternalMPCRefreshMethods {
  RefreshPrepare = 'mpc_refreshPrepare',
  RefreshContext = 'mpc_refreshContext',
  RefreshRound = 'mpc_refreshRound',
  RefreshDone = 'mpc_refreshSuccess',
}

enum InternalMPCMnemonicMethods {
  ApprovalBackup = 'mpc_backupApproval',
  BackupDone = 'mpc_backupUpdate',
  CheckMnemonic = 'mpc_checkMnemonic',
}

const PERMISSIONS = new Map<string, string[]>()

/**
 * resolve request by metamask
 */
PERMISSIONS.set('metamask', [
  SnapKeyringAccountMethods.ListAccounts,
  SnapKeyringAccountMethods.DeleteAccount,
  SnapKeyringAccountMethods.UpdateAccount,
  SnapKeyringRequestMethods.ListRequests,
  SnapKeyringRequestMethods.SubmitRequest,
  SnapKeyringRequestMethods.ApproveRequest,
  SnapKeyringRequestMethods.RejectRequest,
])

const local_websites = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://mpcsnap.safeheron.com',
]
const website_permissions = [
  ...Object.values(InternalMPCMnemonicMethods),
  ...Object.values(InternalMPCRefreshMethods),
  ...Object.values(InternalMPCRecoveryMethods),
  ...Object.values(InternalMPCSignMethods),
  ...Object.values(InternalMPCAccountMethods),
  ...Object.values(InternalSnapCommonMethods),
  ...Object.values(SnapKeyringAccountMethods),
  ...Object.values(SnapKeyringRequestMethods),
]

local_websites.forEach(lw => {
  PERMISSIONS.set(lw, website_permissions)
})

function hasPermission(origin: string, method: string): boolean {
  return Boolean(PERMISSIONS.get(origin)?.includes(method))
}

export const permissionsHandler: OnRpcRequestHandler = async ({
  origin,
  request,
}): Promise<never> => {
  if (!hasPermission(origin, request.method)) {
    throw new Error(`origin ${origin} cannot call method ${request.method}`)
  }
  throw new MethodNotSupportedError(request.method)
}
