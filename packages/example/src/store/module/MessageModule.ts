import { makeAutoObservable } from 'mobx'

import { RPCChannel } from '@/service/channel/RPCChannel'
import MessageRelayer from '@/service/relayer/MessageRelayer'

class MessageModule {
  messageRelayer?: MessageRelayer
  rpcChannel?: RPCChannel

  constructor() {
    makeAutoObservable(this)
  }

  setMessageRelayer(relayer: MessageRelayer) {
    this.messageRelayer = relayer
  }

  setRPCChannel(channel: RPCChannel) {
    this.rpcChannel = channel
  }
}

export default MessageModule
