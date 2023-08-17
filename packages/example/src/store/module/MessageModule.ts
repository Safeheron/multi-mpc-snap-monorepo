import { makeAutoObservable } from 'mobx'

import { RPCChannel } from '@/service/channel/RPCChannel'
import MessageRelayer from '@/service/relayer/MessageRelayer'

class MessageModule {
  messageRelayer?: MessageRelayer
  rpcChannel?: RPCChannel

  constructor() {
    makeAutoObservable(this)
  }

  setMessageRelayer(relayer) {
    this.messageRelayer = relayer
  }

  setRPCChannel(channel) {
    this.rpcChannel = channel
  }
}

export default MessageModule
