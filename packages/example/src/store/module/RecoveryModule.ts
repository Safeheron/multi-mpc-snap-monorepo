import { makeAutoObservable } from 'mobx'

import { RPCChannel } from '@/service/channel/RPCChannel'
import MessageRelayer from '@/service/relayer/MessageRelayer'

type MnemonicFormType = 'init' | 'done' | 'noNeed'

export default class RecoveryModule {
  rpcChannel?: RPCChannel
  messageRelayer?: MessageRelayer

  walletName = ''
  sessionId = ''

  localKeyshareExist = false

  inputMnemonic = ''

  recoverPrepareDialogVisible = false
  recoverDialogVisible = false
  recoverStep = 1

  localCommunicationPub = ''

  mnemonicFormType = ''

  // other party skip input mnemonic
  isSkip = false

  // at least one party has key shard, self party does not need to fill mnemonic
  hasOtherShard = false

  get localPartyHasMnemonic() {
    return this.inputMnemonic || this.localKeyshareExist
  }

  constructor() {
    makeAutoObservable(this)
  }

  setWalletName(name: string) {
    this.walletName = name
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId
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

  setLocalCommunicationPub(pub: string) {
    this.localCommunicationPub = pub
  }

  setRPCChannel(rpcChannel: RPCChannel) {
    this.rpcChannel = rpcChannel
  }

  setMessageRelayer(messageRelayer: MessageRelayer) {
    this.messageRelayer = messageRelayer
  }
}
