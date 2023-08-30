import { makeAutoObservable } from 'mobx'

import { HashItemModel } from '@/service/models'

type MnemonicFormType = 'init' | 'done' | 'noNeed'

class Interactive {
  // common
  loading = false
  sessionId = ''
  walletName = ''
  progress = 0

  // keygen
  walletNameDialogVisible = false
  createDialogVisible = false
  createStep = 1

  // sign
  sendDialogVisible = false
  sendFormCompleted = false
  signTransactionDialogVisible = false
  signStep = 1
  txHash: HashItemModel = {} as HashItemModel

  // recover
  mnemonic = ''
  notBackupDialogVisible = false
  backupDialogVisible = false
  checkShardDialogVisible = false
  recoverPrepareDialogVisible = false
  recoverDialogVisible = false
  recoverStep = 1
  mnemonicFormType: MnemonicFormType = 'init'
  isSkip: boolean
  hasOtherShard: boolean

  constructor() {
    makeAutoObservable(this)
  }

  setLoading(value) {
    this.loading = value
  }

  setSessionId(value) {
    this.sessionId = value
  }

  setCreateDialogVisible(value) {
    this.createDialogVisible = value
  }

  setWalletNameDialogVisible(value) {
    this.walletNameDialogVisible = value
  }

  setWalletName(name) {
    this.walletName = name
  }

  setCreateStep(step) {
    this.createStep = step
  }

  setSendDialogVisible(value) {
    this.sendDialogVisible = value
  }

  setSendFormCompleted(value) {
    this.sendFormCompleted = value
  }

  setSignStep(step) {
    this.signStep = step
  }

  setSignTransactionDialogVisible(value) {
    this.signTransactionDialogVisible = value
  }

  setTxHash(hash) {
    this.txHash = hash
  }

  setProgress(value) {
    this.progress = value
  }

  setProgressAdd(value) {
    this.progress += value
  }

  // TODO 数据放在这里是有问题的
  setMnemonic(value) {
    this.mnemonic = value
  }
  setNotBackupDialogVisible(value) {
    this.notBackupDialogVisible = value
  }
  setBackupDialogVisible(value) {
    this.backupDialogVisible = value
  }
  setCheckShardDialogVisible(value) {
    this.checkShardDialogVisible = value
  }
  setRecoverPrepareDialogVisible(value) {
    this.recoverPrepareDialogVisible = value
  }
  setRecoverDialogVisible(value) {
    this.recoverDialogVisible = value
  }
  setRecoverStep(step) {
    this.recoverStep = step
  }

  setSkip(value) {
    this.isSkip = value
  }

  setOtherShard(value) {
    this.hasOtherShard = value
  }
  setMnemonicFormType(type: MnemonicFormType) {
    this.mnemonicFormType = type
  }
}

export default Interactive
