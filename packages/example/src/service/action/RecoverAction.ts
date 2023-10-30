import type {
  ComputeMessage,
  PartialShard,
  PartyWithZkp,
  PubAndZkp,
  PubKey,
} from '@safeheron/mpcsnap-types'
import { RoleReadyMessage } from '@safeheron/mpcsnap-types/src'
import { message } from 'antd'

import {
  createKeyPair,
  recoverContext,
  recoverMnemonic,
  recoverPrepare,
  recoverRound,
  recoverSetCommunicationPub,
  refreshContext,
  refreshPrepare,
  refreshRound,
  refreshSuccess,
} from '@/service/metamask'
import { MPCMessageType, PartyId } from '@/service/types'
import { store } from '@/store'
import { reportRecoverSuccess } from '@/utils/sentryUtil'

import { MPCMessage, PartyIndexMap } from '../types'

interface PartyInfo {
  partyId: PartyId
  name: string
}

class RecoverAction {
  partySecretKeys: PartialShard[] = []
  pubKeyOfThreeParty = ''
  remotePartyInfo?: PartyInfo
  lostPartyInfo?: PartyInfo
  remotePubKeys: PubKey[] = []

  async handleRoleReady(messageArray: RoleReadyMessage[]) {
    const walletIdArray = messageArray
      .map(m => m.messageContent.walletId)
      .filter(Boolean)
    if (store.accountModule.walletId) {
      walletIdArray.push(store.accountModule.walletId)
    }

    if (walletIdArray && walletIdArray.length >= 2) {
      const firstEle = walletIdArray[0]
      const walletMatched = walletIdArray.every(wi => wi === firstEle)
      if (!walletMatched) {
        message.error(
          `Wallet not matched, it seems that you used different wallet to recover, these wallet ids are ${walletIdArray.join(
            ', '
          )}`,
          5
        )
        store.messageModule.rpcChannel?.next({
          sendType: 'broadcast',
          messageType: MPCMessageType.abort,
          messageContent: 'recover',
        })
        store.recoveryModule.setRecoverDialogVisible(false)
        return
      }
    }

    await recoverSetCommunicationPub(
      messageArray.map(ma => ({
        partyId: ma.messageContent.partyId,
        pub: ma.messageContent.pub,
      }))
    )

    store.messageModule.rpcChannel?.next({
      messageType: MPCMessageType.recoverReady,
      messageContent: store.recoveryModule.localKeyshareExist,
    })
  }

  async handleRecoverReady(messageArray: MPCMessage<boolean>[]) {
    // has 3 keyShard
    if (
      messageArray.every(v => v.messageContent === true) &&
      !!store.accountModule.address
    ) {
      // If both side have key shards, don't needed recovery
      store.recoveryModule.setMnemonicFormType('noNeed')
      return
    }
    if (!!store.accountModule.address) {
      // If I have private key shards on my side
      store.interactive.setWalletName(store.accountModule.walletName)
      store.recoveryModule.setMnemonicFormType('done')
      store.messageModule.rpcChannel?.next({
        messageType: MPCMessageType.mnemonicReady,
        messageContent: {
          hasMnemonic: true,
          walletName: store.interactive.walletName,
          partyId: PartyId.A,
        },
      })
    } else {
      // If I don't have a private key shard, jump to enter the mnemonic step
      store.recoveryModule.setMnemonicFormType('init')
      // If other side have key shards, there is no need to enter wallet Name
      if (messageArray.some(v => v.messageContent === true)) {
        store.recoveryModule.setOtherShard(true)
      }
    }
  }

  async handleMnemonicReady(
    messageArray: MPCMessage<{
      hasMnemonic: boolean
      walletName?: string
      partyId: PartyId
    }>[]
  ) {
    console.log('handleMnemonicReady', messageArray)

    if (!store.interactive.walletName) {
      const walletName = messageArray.find(v => v.messageContent.walletName)
        ?.messageContent.walletName
      store.interactive.setWalletName(walletName)
    }
    store.recoveryModule.setRecoverStep(4)

    // all mnemonic are ready
    if (
      messageArray.every(v => v.messageContent.hasMnemonic) &&
      store.recoveryModule.localPartyHasMnemonic
    ) {
      await this.recoverPrepare(() => {
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.recoverSuccess,
          messageContent: null,
        })
      })
    } else {
      if (
        store.recoveryModule.localKeyshareExist ||
        store.recoveryModule.localPartyHasMnemonic
      ) {
        const remoteParty = messageArray.find(v => v.messageContent.hasMnemonic)

        const lostParty = messageArray.find(v => !v.messageContent.hasMnemonic)

        if (!remoteParty || !lostParty) {
          throw new Error('failed')
        }
        this.remotePartyInfo = {
          partyId: remoteParty.messageContent.partyId,
          name: remoteParty.from,
        }
        this.lostPartyInfo = {
          partyId: lostParty.messageContent.partyId,
          name: lostParty.from,
        }
      }

      await this.recoverPrepare(async () => {
        const res = await createKeyPair(store.interactive.sessionId)
        if (res.success) {
          store.messageModule.rpcChannel?.next({
            messageType: MPCMessageType.keyPairReady,
            messageContent: {
              partyId: PartyId.A,
              pubKey: res.data,
            },
          })
        }
      })
    }
  }

  async handleKeyPairReady(
    messageArray: MPCMessage<{ partyId: PartyId; pubKey: string }>[]
  ) {
    await recoverSetCommunicationPub(
      messageArray.map(ma => ({
        partyId: ma.messageContent.partyId,
        pub: ma.messageContent.pubKey,
      }))
    )

    if (store.recoveryModule.localPartyHasMnemonic) {
      const lostPub = messageArray.find(
        v => v.messageContent.partyId === this.lostPartyInfo?.partyId
      )?.messageContent.pubKey
      const remotePub = messageArray.find(
        v => v.messageContent.partyId === this.remotePartyInfo?.partyId
      )?.messageContent.pubKey

      // no party lost
      if (!lostPub) {
        return
      }

      if (!this.remotePartyInfo || !this.lostPartyInfo) return

      const localParty = {
        partyId: PartyId.A,
        index: PartyIndexMap[PartyId.A],
      }
      const remoteParty = {
        partyId: this.remotePartyInfo.partyId,
        index: PartyIndexMap[this.remotePartyInfo.partyId],
        pub: remotePub!,
      }
      const lostParty = {
        partyId: this.lostPartyInfo.partyId,
        index: PartyIndexMap[this.lostPartyInfo.partyId],
        pub: lostPub,
      }

      const res = await recoverContext(
        store.interactive.sessionId,
        localParty,
        remoteParty,
        lostParty
      )
      if (res.success) {
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.recoverRound,
          messageContent: res.data,
          to: this.remotePartyInfo.name,
        })
      }
    } else {
      messageArray.forEach(v => {
        this.remotePubKeys.push({
          pubKey: v.messageContent.pubKey,
          partyId: v.messageContent.partyId,
        })
      })
    }
  }

  // @ts-ignore
  async handleRecoverRound(message: MPCMessage<ComputeMessage[]>) {
    const res = await recoverRound(
      store.interactive.sessionId,
      message.messageContent
    )
    if (res.success) {
      if (res.data?.isComplete) {
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.partySecretKeyReady,
          messageContent: {
            partyId: PartyId.A,
            partySecretKey: res.data.partySecretKey,
            pubKeyOfThreeParty: res.data.pubKeyOfThreeParty,
          },
          sendType: 'broadcast',
        })
        await this.recoverPrepare(() => {
          store.messageModule.rpcChannel?.next({
            messageType: MPCMessageType.recoverSuccess,
            messageContent: null,
          })
        })
      } else {
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.recoverRound,
          messageContent: res.data?.message,
          to: this.remotePartyInfo?.name,
        })
      }
    }
  }

  async handleRecoverSuccess() {
    const res = await refreshPrepare(store.interactive.sessionId)
    if (res.success) {
      store.messageModule.rpcChannel?.next({
        messageType: MPCMessageType.refreshReady,
        messageContent: {
          X: res.data?.X,
          dlog_zkp: res.data?.dlog_zkp,
          partyId: PartyId.A,
        },
      })
    }
  }

  async handleRefreshReady(
    messageArray: MPCMessage<PubAndZkp & { partyId: PartyId }>[]
  ) {
    const remoteParties: PartyWithZkp[] = messageArray.map(v => ({
      party_id: v.messageContent.partyId,
      index: PartyIndexMap[v.messageContent.partyId],
      X: v.messageContent.X,
      dlog_zkp: v.messageContent.dlog_zkp,
    }))
    const res = await refreshContext(
      store.interactive.sessionId,
      {
        party_id: PartyId.A,
        index: PartyIndexMap[PartyId.A],
      },
      remoteParties
    )
    if (res.success) {
      store.messageModule.rpcChannel?.next({
        messageType: MPCMessageType.refreshRound,
        messageContent: res.data,
      })
    }
  }

  async handleRefreshRound(messageArray: MPCMessage<ComputeMessage[]>[]) {
    console.log('handleRefreshRound', messageArray)

    const remoteMessageList = messageArray.map(
      v =>
        v.messageContent.find(
          msg => msg.destination === PartyId.A
        ) as ComputeMessage
    )
    const res = await refreshRound(
      store.interactive.sessionId,
      remoteMessageList
    )
    if (res.success) {
      if (res.data.isComplete) {
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.refreshSuccess,
          messageContent: null,
        })
      } else {
        // continue round
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.refreshRound,
          messageContent: res.data?.message,
        })
      }
    }
  }

  async handleRefreshSuccess() {
    const res = await refreshSuccess(store.interactive.sessionId)
    if (res.success) {
      store.accountModule.setAccount(res.data)
      store.recoveryModule.setRecoverStep(5)
      reportRecoverSuccess(res.data.address, res.data.id, res.data.walletName)
      this.destroy()
    }
  }

  // --broadcast--
  async handleMnemonicSkip() {
    store.recoveryModule.setSkip(true)
  }

  async handlePartySecretKeyReady(
    message: MPCMessage<{
      partyId: PartyId
      partySecretKey: string
      pubKeyOfThreeParty: string
    }>
  ) {
    const shard = message.messageContent.partySecretKey
    const pubKeyOfThreeParty = message.messageContent.pubKeyOfThreeParty
    this.partySecretKeys.push({
      partyId: message.messageContent.partyId,
      shard,
    })
    this.pubKeyOfThreeParty = pubKeyOfThreeParty

    if (this.partySecretKeys.length === 2) {
      console.log('partySecretKeys', this.partySecretKeys)

      if (!this.remotePubKeys.length) return

      const res = await recoverMnemonic(
        store.interactive.sessionId,
        this.partySecretKeys,
        pubKeyOfThreeParty,
        this.remotePubKeys
      )

      if (res.success) {
        await this.recoverPrepare(() => {
          store.messageModule.rpcChannel?.next({
            messageType: MPCMessageType.recoverSuccess,
            messageContent: null,
          })
        })
      }
    }
  }

  private async recoverPrepare(next) {
    const res = await recoverPrepare(
      store.interactive.sessionId,
      store.interactive.walletName,
      store.recoveryModule.inputMnemonic
    )
    if (res.success) {
      next && next()
    }
  }

  destroy() {
    store.interactive.setProgress(0)
    store.interactive.setWalletName('')

    store.recoveryModule.setInputMnemonic('')
    store.recoveryModule.setOtherShard(false)
    store.recoveryModule.setSkip(false)
    store.recoveryModule.setMnemonicFormType('init')
  }
}

export default new RecoverAction()
