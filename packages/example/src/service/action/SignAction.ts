import { message } from 'antd'

import { TransactionStatusEnum } from '@/configs/Enums'
import { PartyId } from '@/service/types'
import { store } from '@/store'
import { ethers, provider } from '@/utils'

import { signContext, signRound } from '../metamask'
import { TxRecordItem } from '../models'
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
        console.log('signedTransaction:', signedTransaction)

        console.log(
          'parseTransaction',
          ethers.utils.parseTransaction(signedTransaction)
        )

        this.sendTransaction(signedTransaction)
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
    if (!provider) return
    try {
      const response = await provider.sendTransaction(signedTransaction)
      if ('error' in response) {
        console.error('response', response)
        message.error('Failed')
        return
      }
      console.log('txhash', response.hash)
      store.interactive.setTxHash(response.hash)
      const item: TxRecordItem = {
        txHash: response.hash,
        method: 'Transfer',
        from: store.accountModule.address,
        to: store.transactionModule.transactionObject.to,
        value: store.transactionModule.transactionObject.value,
        status: TransactionStatusEnum.pending,
        date: Date.now(),
      }
      store.transactionModule.addTransaction(item)
      store.interactive.setSignStep(4)
      store.interactive.setProgress(0)

      // const receipt = await response.wait()

      // console.log('sendTransaction receipt result', receipt)
    } catch (error) {
      console.error('sendTransaction', error)

      store.interactive.setSignTransactionDialogVisible(false)
      message.error(error.error?.message || error.message)
    }
  },
}

export default SignAction
