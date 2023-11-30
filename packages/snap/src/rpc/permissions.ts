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

// ----------------------------------
//  internal mpc methods

enum InternalSnapCommonMethods {
  KeepAlive = 'mpc_snapKeepAlive',
}

// keygen methods
enum InternalMPCKeygenMethods {
  ApprovalCreateAccount = 'mpc_createApproval',
  CreateAccountContext = 'mpc_createContext',
  CreateAccountRound = 'mpc_createRound',
  CreateAccountDone = 'mpc_createSuccess',
}

// mpc-sign methods
enum InternalMPCSignMethods {
  ApprovalSign = 'mpc_signApproval',
  SignContext = 'mpc_signContext',
  SignRound = 'mpc_signRound',
}

// recovery methods
export enum InternalMPCRecoveryMethods {
  ApprovalRecovery = 'mpc_recoverApproval',
  RecoveryPrepare = 'mpc_recoverPrepare',
  RecoverSetCommunicationPubs = 'mpc_recoverSetCommuPubs',
  RecoveryContext = 'mpc_recoverContext',
  RecoveryRound = 'mpc_recoverRound',
  RecoveryMnemonic = 'mpc_recoverMnemonic',
  RefreshPrepare = 'mpc_refreshPrepare',
  RefreshContext = 'mpc_refreshContext',
  RefreshRound = 'mpc_refreshRound',
  RefreshDone = 'mpc_refreshSuccess',
}

// backup methods
enum InternalMPCMnemonicMethods {
  ApprovalBackup = 'mpc_backupApproval',
  BackupDone = 'mpc_backupUpdate',
}

export enum InternalMPCOtherMethods {
  ListAccounts = 'mpc_requestAccount',
  DeleteAccount = 'mpc_deleteWallet',
  SyncAccount = 'mpc_syncAccount',
  CheckMnemonic = 'mpc_checkMnemonic',
  listPendingRequests = 'internal_listPendingRequests',
  RemindAfterFirstInstall = 'internal_firstInstallRemainder',
}

const PERMISSIONS = new Map<string, string[]>()

/**
 * resolve request by metamask
 */
PERMISSIONS.set('metamask', [
  ...Object.values(SnapKeyringAccountMethods),
  ...Object.values(SnapKeyringRequestMethods),
])

const websites = ALLOW_SITES

const website_permissions = [
  ...Object.values(InternalMPCMnemonicMethods),
  ...Object.values(InternalMPCKeygenMethods),
  ...Object.values(InternalMPCRecoveryMethods),
  ...Object.values(InternalMPCSignMethods),
  ...Object.values(InternalMPCOtherMethods),
  ...Object.values(InternalSnapCommonMethods),
  SnapKeyringRequestMethods.RejectRequest,
]

websites.forEach(lw => {
  PERMISSIONS.set(lw, website_permissions)
})

function hasPermission(origin: string, method: string): boolean {
  return Boolean(PERMISSIONS.get(origin)?.includes(method))
}

export const permissionsDetect = async ({ origin, request }): Promise<void> => {
  if (!hasPermission(origin, request.method)) {
    throw new Error(
      `origin ${origin} not allowed to call method ${request.method}`
    )
  }
}

export function isKeyringRpcMethod(method) {
  return (
    Object.values(SnapKeyringAccountMethods).includes(method) ||
    Object.values(SnapKeyringRequestMethods).includes(method)
  )
}

export function isMPCKeygenMethod(method: string) {
  return Object.values(InternalMPCKeygenMethods).includes(
    method as InternalMPCKeygenMethods
  )
}

export function isMPCSignMethod(method: string) {
  return Object.values(InternalMPCSignMethods).includes(
    method as InternalMPCSignMethods
  )
}

export function isRecoveryMethod(method: string) {
  return Object.values(InternalMPCRecoveryMethods).includes(
    method as InternalMPCRecoveryMethods
  )
}

export function isBackupMethod(method: string) {
  return Object.values(InternalMPCMnemonicMethods).includes(
    method as InternalMPCMnemonicMethods
  )
}
