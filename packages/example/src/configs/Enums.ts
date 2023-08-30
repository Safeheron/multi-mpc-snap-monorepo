export enum RouterEnum {
  home = '/home',
  index = '/',
}

export enum SnapInvokeMethods {
  heartBeat = 'mpc_snapKeepAlive',

  createApproval = 'mpc_createApproval',
  createParty = 'mpc_createParty',
  createContext = 'mpc_createContext',
  createRound = 'mpc_createRound',
  createSuccess = 'mpc_createSuccess',

  signApproval = 'mpc_signApproval',
  signContext = 'mpc_signContext',
  signRound = 'mpc_signRound',

  requestAccount = 'mpc_requestAccount',
  syncAccount = 'mpc_syncAccount',
  deleteWallet = 'mpc_deleteWallet',
  checkMnemonic = 'mpc_checkMnemonic',

  backupApproval = 'mpc_backupApproval',
  backupQuery = 'mpc_backupQuery',
  backupUpdate = 'mpc_backupUpdate',

  recoverApproval = 'mpc_recoverApproval',
  recoverPrepare = 'mpc_recoverPrepare',
  recoverKeyPair = 'mpc_recoverKeyPair',
  recoverContext = 'mpc_recoverContext',
  recoverRound = 'mpc_recoverRound',
  recoverMnemonic = 'mpc_recoverMnemonic',
  refreshPrepare = 'mpc_refreshPrepare',
  refreshContext = 'mpc_refreshContext',
  refreshRound = 'mpc_refreshRound',
  refreshSuccess = 'mpc_refreshSuccess',

  test = 'mpc_test',
}
