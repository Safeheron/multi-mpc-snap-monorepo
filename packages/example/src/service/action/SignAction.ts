import { SignReadyMessage } from '@safeheron/mpcsnap-types'
import { message } from 'antd'
import { ethers } from 'ethers'

import { PartyId } from '@/service/types'
import { store } from '@/store'
import { reportSignSuccess } from '@/utils/sentryUtil'

import { signContext, signRound } from '../metamask'
import { MPCMessage, MPCMessageType } from '../types'

let provider: undefined | ethers.providers.Web3Provider

const SignAction = {
  emitSignFlowError(errMsg: string) {
    store.signModule.rpcChannel?.emitAbortMessage('sign', 'error', errMsg)
  },

  async handleSignReady(messageArray: SignReadyMessage[]) {
    store.signModule.setSignStep(3)

    const { partyId, pub } = messageArray[0].messageContent
    const remotePub = { partyId, pub }

    const res = await signContext(
      store.signModule.sessionId,
      [partyId, PartyId.A],
      remotePub
    )

    if (res.success) {
      store.signModule.rpcChannel?.next({
        messageType: MPCMessageType.signRound,
        messageContent: res.data,
      })
    } else {
      this.emitSignFlowError(
        res.errMsg ?? `SignFlow error: call rpc createContext method error.`
      )
    }
  },

  async handleSignRound(messageArray: MPCMessage[]) {
    const remoteMessageList = messageArray.map(v =>
      v.messageContent.find(msg => msg.destination === PartyId.A)
    )
    const res = await signRound(store.signModule.sessionId, remoteMessageList)
    if (res.success) {
      console.log('handleSignRound result', res.data)
      if (res.data.isComplete) {
        const signedTransaction = res.data.signedTransaction
        if (signedTransaction) {
          console.log('signedTransaction:', signedTransaction)

          await this.sendTransaction(signedTransaction)
        }
        store.signModule.setSignStep(4)

        reportSignSuccess(
          store.accountModule.address,
          store.accountModule.walletId,
          store.signModule.pendingRequest.method
        )
      } else {
        // continue round
        store.signModule.rpcChannel?.next({
          messageType: MPCMessageType.signRound,
          messageContent: res.data.message,
        })
      }
    } else {
      this.emitSignFlowError(
        res.errMsg ?? 'SignFlow error: call rpc signRound method error.'
      )
    }
  },

  async sendTransaction(signedTransaction: string) {
    if (!provider) {
      // @ts-ignore
      provider = new ethers.providers.Web3Provider(window.ethereum)
    }
    try {
      const response = await provider.sendTransaction(signedTransaction)
      if ('error' in response) {
        console.error('send transaction occur an error: ', response.error)
        message.error('Sign success but send transaction with provider failed.')
      } else {
        store.interactive.setProgress(0)

        store.signModule.setTxHash(response.hash)
        store.signModule.setSignStep(4)
      }
    } catch (error) {
      console.error('sendTransaction with error: ', error)
      message.error(error.error?.message || error.message)
    } finally {
      store.signModule.setSignTransactionDialogVisible(false)
    }
  },
}

export default SignAction
