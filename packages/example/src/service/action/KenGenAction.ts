import { OperationType } from '@safeheron/mpcsnap-types'

import { PartyId } from '@/service/types'
import { store } from '@/store'
import { reportWalletCreation } from '@/utils/sentryUtil'

import { createContext, createRound, createSuccess } from '../metamask'
import { MPCMessage } from '../types'

const KenGenAction = {
  emitKeygenFlowError(errMsg: string) {
    store.keygenModule.rpcChannel?.emitAbortMessage('keygen', 'error', errMsg)
  },

  async handlePartyReady(messageArray: MPCMessage[]) {
    const remoteParties = messageArray.map(
      ({ messageContent }) => messageContent
    )

    const res = await createContext(store.keygenModule.sessionId, remoteParties)

    if (res.success) {
      store.keygenModule.rpcChannel?.next({
        messageType: OperationType.keyGenRound,
        messageContent: res.data,
      })
    } else {
      this.emitKeygenFlowError(
        res.errMsg ?? 'KeygenFlow error: call rpc createContext method error.'
      )
    }
  },

  async handleKeyGenRound(messageArray: MPCMessage[]) {
    const remoteMessageList = messageArray.map(v =>
      v.messageContent.find(msg => msg.destination === PartyId.A)
    )

    const res = await createRound(
      store.keygenModule.sessionId,
      remoteMessageList
    )
    if (res.success) {
      if (res.data.isComplete) {
        store.keygenModule.rpcChannel?.next({
          messageType: OperationType.createSuccess,
          messageContent: null,
        })
      } else {
        // continue round
        store.keygenModule.rpcChannel?.next({
          messageType: OperationType.keyGenRound,
          messageContent: res.data.message,
        })
      }
    } else {
      this.emitKeygenFlowError(
        res.errMsg ?? 'KeygenFlow error: call rpc keygenRound method error.'
      )
    }
  },

  async handleCreateSuccess() {
    const res = await createSuccess(store.keygenModule.sessionId)
    if (res.success) {
      store.keygenModule.setCreateStep(4)
      store.interactive.setProgress(0)
      reportWalletCreation(res.data.address, res.data.id, res.data.walletName)
    } else {
      this.emitKeygenFlowError(
        res.errMsg ?? 'KeygenFlow error: call keygenSuccess method error.'
      )
    }
  },
}

export default KenGenAction
