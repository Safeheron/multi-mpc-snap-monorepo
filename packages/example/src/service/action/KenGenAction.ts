import { PartyId } from '@/service/types'
import { store } from '@/store'

import { createContext, createRound, createSuccess } from '../metamask'
import { MPCMessage, MPCMessageType } from '../types'

const KenGenAction = {
  async handlePartyReady(messageArray: MPCMessage[]) {
    const remoteParties = messageArray.map(
      ({ messageContent }) => messageContent
    )

    const res = await createContext(store.interactive.sessionId, remoteParties)

    if (res.success) {
      console.log('createContext result', res.data)

      store.messageModule.rpcChannel?.next({
        messageType: MPCMessageType.keyGenRound,
        messageContent: res.data,
      })
    }
  },

  async handleKeyGenRound(messageArray: MPCMessage[]) {
    const remoteMessageList = messageArray.map(v =>
      v.messageContent.find(msg => msg.destination === PartyId.A)
    )

    const res = await createRound(
      store.interactive.sessionId,
      remoteMessageList
    )
    if (res.success) {
      if (res.data.isComplete) {
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.createSuccess,
          messageContent: null,
        })
      } else {
        // continue round
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.keyGenRound,
          messageContent: res.data.message,
        })
      }
    }
  },

  async handleCreateSuccess() {
    const res = await createSuccess(store.interactive.sessionId)
    if (res.success) {
      store.interactive.setCreateStep(4)
      store.interactive.setProgress(0)
    }
  },
}

export default KenGenAction
