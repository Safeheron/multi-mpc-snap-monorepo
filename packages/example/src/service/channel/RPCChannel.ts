import {
  AbortMessage,
  BaseRelayMessage,
  OperationType,
  SendType,
} from '@safeheron/mpcsnap-types'
import { AbortMessageContent } from '@safeheron/mpcsnap-types/src'
import { message } from 'antd'

import { MessageChannel } from '@/service/channel/MessageChannel'
import { MPCMessage, MPCMessageType, PartyId } from '@/service/types'
import { store } from '@/store'

import KenGenAction from '../action/KenGenAction'
import RecoverAction from '../action/RecoverAction'
import SignAction from '../action/SignAction'

export class RPCChannel extends MessageChannel {
  constructor() {
    super('snap')
  }

  protected disconnect(): void {
    // xx
  }

  // call rpc
  protected async sendExternal(messageArray: MPCMessage[]) {
    const type = messageArray[0].messageType
    console.debug('[RPC channel] send message ↑', type, messageArray)
    const { interactive } = store

    switch (type) {
      // create
      case MPCMessageType.partyReady:
        interactive.setProgress(15)
        await KenGenAction.handlePartyReady(messageArray)
        interactive.setProgress(31)
        break
      case MPCMessageType.keyGenRound:
        interactive.setProgressAdd(6)
        await KenGenAction.handleKeyGenRound(messageArray)
        interactive.setProgressAdd(6)
        break
      case MPCMessageType.createSuccess:
        interactive.setProgress(100)
        await KenGenAction.handleCreateSuccess()
        break

      // sign
      case MPCMessageType.signReady:
        interactive.setProgress(6)
        // @ts-ignore
        await SignAction.handleSignReady(messageArray)
        interactive.setProgress(12)
        break
      case MPCMessageType.signRound:
        interactive.setProgressAdd(11)
        await SignAction.handleSignRound(messageArray)
        interactive.setProgressAdd(11)
        break

      // recover
      case MPCMessageType.roleReady:
        interactive.setProgress(4)
        // @ts-ignore
        await RecoverAction.handleRoleReady(messageArray)
        interactive.setProgress(8)
        break
      case MPCMessageType.recoverReady:
        interactive.setProgress(12)
        await RecoverAction.handleRecoverReady(messageArray)
        interactive.setProgress(16)
        break
      case MPCMessageType.mnemonicReady:
        interactive.setProgress(21)
        await RecoverAction.handleMnemonicReady(messageArray)
        interactive.setProgress(25)
        break
      case MPCMessageType.recoverSuccess:
        interactive.setProgress(37)
        await RecoverAction.handleRecoverSuccess()
        interactive.setProgress(41)
        break
      case MPCMessageType.refreshReady:
        interactive.setProgress(46)
        await RecoverAction.handleRefreshReady(messageArray)
        interactive.setProgress(62)
        break
      case MPCMessageType.refreshRound:
        interactive.setProgressAdd(5)
        await RecoverAction.handleRefreshRound(messageArray)
        interactive.setProgressAdd(5)
        break
      case MPCMessageType.refreshSuccess:
        interactive.setProgress(99)
        await RecoverAction.handleRefreshSuccess()
        interactive.setProgress(100)
        break

      // p2p
      case MPCMessageType.recoverRound:
        await RecoverAction.handleRecoverRound(messageArray[0])
        break
      // broadcast
      case MPCMessageType.mnemonicSkip:
        await RecoverAction.handleMnemonicSkip()
        break
      case MPCMessageType.partySecretKeyReady:
        await RecoverAction.handlePartySecretKeyReady(messageArray[0])
        break
      case MPCMessageType.abort:
        // @ts-ignore
        const { messageContent } = messageArray[0] as AbortMessage
        this.handleAbort(messageContent.businessType, messageContent.reason)
        break
      default:
        console.log('not allow')
        break
    }
  }

  next(
    msg:
      | Omit<MPCMessage, 'from'>
      | Omit<BaseRelayMessage<OperationType, SendType, any>, 'from'>
  ) {
    this.receiveExternal(
      JSON.stringify({
        from: this.name,
        ...msg,
      })
    )
  }

  emitAbortMessage(
    businessType: AbortMessageContent['businessType'],
    abortType: AbortMessageContent['abortType'],
    reason: string
  ) {
    const abortMessage: AbortMessage = {
      messageType: OperationType.abort,
      sendType: 'broadcast',
      messageContent: {
        from: PartyId.A,
        businessType,
        abortType,
        reason,
      },
    }

    this.next(abortMessage)

    this.handleAbort(businessType, reason)
  }

  private handleAbort(
    type: AbortMessageContent['businessType'],
    errMessage?: string
  ) {
    const { interactive, recoveryModule, signModule, keygenModule } = store
    interactive.setProgress(0)

    switch (type) {
      case 'keygen':
        message.error(errMessage ?? 'Create wallet canceled', 5)
        keygenModule.setCreateDialogVisible(false)
        break

      case 'sign':
        message.error(errMessage ?? 'Sign canceled', 5)
        signModule.setSignTransactionDialogVisible(false)
        break

      case 'recover':
        message.error(errMessage ?? 'Recover canceled', 5)
        recoveryModule.setRecoverDialogVisible(false)
        break

      default:
        message.error(errMessage ?? 'Process Aborted.', 5)
        keygenModule.setCreateDialogVisible(false)
        signModule.setSignTransactionDialogVisible(false)
        recoveryModule.setRecoverDialogVisible(false)
        break
    }
  }
}
