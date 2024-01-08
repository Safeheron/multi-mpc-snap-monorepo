import { makeAutoObservable } from 'mobx'

import { backupApproval, backupUpdate } from '@/service/metamask'

class BackupModule {
  private sessionId = ''
  mnemonic = ''
  notBackupDialogVisible = false
  backupDialogVisible = false
  checkShardDialogVisible = false

  constructor() {
    makeAutoObservable(this)
  }

  setMnemonic(value: string) {
    this.mnemonic = value
  }
  setNotBackupDialogVisible(value: boolean) {
    this.notBackupDialogVisible = value
  }
  setBackupDialogVisible(value: boolean) {
    this.backupDialogVisible = value
  }
  setCheckShardDialogVisible(value: boolean) {
    this.checkShardDialogVisible = value
  }

  async requestBackupApproval(walletName: string) {
    const res = await backupApproval(walletName)
    if (res.success) {
      this.sessionId = res.data.sessionId
      this.mnemonic = res.data.mnemonic
      this.backupDialogVisible = true
    }
    return res
  }

  async finishBackup() {
    const res = await backupUpdate(this.sessionId)
    if (res.success) {
      this.mnemonic = ''
      this.sessionId = ''
    }
    return res
  }
}

export default BackupModule
