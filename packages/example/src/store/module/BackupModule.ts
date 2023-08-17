import { makeAutoObservable } from 'mobx'

class BackupModule {
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
}

export default BackupModule
