import { makeAutoObservable } from 'mobx'

import { HashItemModel } from '@/service/models'

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
}

export default Interactive
