import { Infer, literal, object, string } from 'superstruct'

import { CommonHeader } from './common'

export interface RequestAccount {
  method: 'mpc_requestAccount'
}

export interface DeleteWallet {
  method: 'mpc_deleteWallet'
}

export const BackupApprovalStruct = object({
  ...CommonHeader,
  method: literal('mpc_backupApproval'),
  params: object({
    walletName: string(),
  }),
})
export type BackupApproval = Infer<typeof BackupApprovalStruct>

export const BackupUpdateStruct = object({
  ...CommonHeader,
  method: literal('mpc_backupUpdate'),
  params: object({
    sessionId: string(),
  }),
})
export type BackupUpdate = Infer<typeof BackupUpdateStruct>

export const CheckMnemonicStruct = object({
  ...CommonHeader,
  method: literal('mpc_checkMnemonic'),
  params: object({
    walletName: string(),
  }),
})
export type CheckMnemonic = Infer<typeof CheckMnemonicStruct>
