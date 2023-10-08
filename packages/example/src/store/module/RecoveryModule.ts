import { makeAutoObservable } from 'mobx'

type MnemonicFormType = 'init' | 'done' | 'noNeed'

class RecoveryModule {
  walletName = ''
  sessionId = ''

  localKeyshareExist = false

  inputMnemonic = ''

  recoverPrepareDialogVisible = false
  recoverDialogVisible = false
  recoverStep = 1

  mnemonicFormType = ''

  isSkip = false
  hasOtherShard = false

  get localPartyHasMnemonic() {
    return this.inputMnemonic || this.localKeyshareExist
  }

  constructor() {
    makeAutoObservable(this)
  }

  setLocalKeyshareExist(val: boolean) {
    this.localKeyshareExist = val
  }

  setRecoverPrepareDialogVisible(value: boolean) {
    this.recoverPrepareDialogVisible = value
  }
  setRecoverDialogVisible(value: boolean) {
    this.recoverDialogVisible = value
  }

  setRecoverStep(step: number) {
    this.recoverStep = step
  }

  setSkip(value: boolean) {
    this.isSkip = value
  }

  setOtherShard(value: boolean) {
    this.hasOtherShard = value
  }
  setMnemonicFormType(type: MnemonicFormType) {
    this.mnemonicFormType = type
  }

  setInputMnemonic(mnemonic: string) {
    this.inputMnemonic = mnemonic
  }
}

export default RecoveryModule
