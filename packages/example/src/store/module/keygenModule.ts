import { makeAutoObservable } from 'mobx'

import { RPCChannel } from '@/service/channel/RPCChannel'
import MessageRelayer from '@/service/relayer/MessageRelayer'

export default class KeygenModule {
  sessionId = ''

  walletName = ''

  messageRelayer?: MessageRelayer

  createStep = 1

  createDialogVisible = false

  walletNameDialogVisible = false

  rpcChannel?: RPCChannel

  constructor() {
    makeAutoObservable(this)
  }

  setWalletNameDialogVisible(value: boolean) {
    this.walletNameDialogVisible = value
  }

  setCreateDialogVisible(visible: boolean) {
    this.createDialogVisible = visible
  }

  setWalletName(name: string) {
    this.walletName = name
  }

  setRPCChannel(rpcChannel: RPCChannel) {
    this.rpcChannel = rpcChannel
  }

  setMessageRelayer(messageRelayer: MessageRelayer) {
    this.messageRelayer = messageRelayer
  }

  setCreateStep(step: number) {
    this.createStep = step
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId
  }
}
