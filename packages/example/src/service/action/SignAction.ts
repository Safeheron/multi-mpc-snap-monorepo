import { message } from 'antd'

import { PartyId } from '@/service/types'
import { store } from '@/store'
import { ethers, provider } from '@/utils'

import { signContext, signRound } from '../metamask'
import { MPCMessage, MPCMessageType } from '../types'

const SignAction = {
  async handleSignReady(messageArray: MPCMessage[]) {
    store.interactive.setSignStep(3)
    const res = await signContext(
      store.interactive.sessionId,
      messageArray[0].messageContent
    )

    if (res.success) {
      console.log('handleSignReady result', res.data)
      store.messageModule.rpcChannel?.next({
        messageType: MPCMessageType.signRound,
        messageContent: res.data,
      })
    }
  },
  async handleSignRound(messageArray: MPCMessage[]) {
    const remoteMessageList = messageArray.map(v =>
      v.messageContent.find(msg => msg.destination === PartyId.A)
    )
    const res = await signRound(store.interactive.sessionId, remoteMessageList)
    if (res.success) {
      console.log('handleSignRound result', res.data)
      if (res.data.isComplete) {
        const signedTransaction = res.data.signedTransaction
        if (signedTransaction) {
          console.log('signedTransaction:', signedTransaction)

          console.log(
            'parseTransaction',
            ethers.utils.parseTransaction(signedTransaction)
          )

          await this.sendTransaction(signedTransaction)
        }
        store.interactive.setSignStep(4)
      } else {
        // continue round
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.signRound,
          messageContent: res.data.message,
        })
      }
    }
  },

  async sendTransaction(signedTransaction: string) {
    if (!provider) {
      console.warn('No provider, can not broadcast transaction.')
      return
    }
    try {
      const response = await provider.sendTransaction(signedTransaction)
      if ('error' in response) {
        console.error('response', response)
        message.error('Failed')
        return
      }
      console.log('txhash', response.hash)

      store.interactive.setSignStep(4)
      store.interactive.setProgress(0)
    } catch (error) {
      console.error('sendTransaction', error)

      store.interactive.setSignTransactionDialogVisible(false)
      message.error(error.error?.message || error.message)
    }
  },
}

export default SignAction
