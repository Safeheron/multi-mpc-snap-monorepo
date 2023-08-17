import type {
  ComputeMessage,
  PartialShard,
  PartyWithZkp,
  PubAndZkp,
  PubKey,
} from '@safeheron/mpcsnap-types'

import {
  createKeyPair,
  recoverContext,
  recoverMnemonic,
  recoverPrepare,
  recoverRound,
  refreshContext,
  refreshPrepare,
  refreshRound,
  refreshSuccess,
} from '@/service/metamask'
import { PartyId } from '@/service/types'
import { store } from '@/store'

import { MPCMessage, MPCMessageType, PartyIndexMap } from '../types'

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

  async handleRoleReady(
    messageArray: MPCMessage<{ partyId: PartyId; index: number }>[]
  ) {
    store.messageModule.rpcChannel?.next({
      messageType: MPCMessageType.recoverReady,
      messageContent: !!store.interactive.mnemonic,
    })
  }

  async handleRecoverReady(messageArray: MPCMessage<boolean>[]) {
    // has 3 keyShard
    if (
      messageArray.every(v => v.messageContent === true) &&
      !!store.accountModule.address
    ) {
      // If both side have key shards, don't needed recovery
      store.interactive.setMnemonicFormType('noNeed')
      return
    }
    if (!!store.accountModule.address) {
      // If I have private key shards on my side
      store.interactive.setWalletName(store.accountModule.walletName)
      store.interactive.setMnemonicFormType('done')
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
      store.interactive.setMnemonicFormType('init')
      // If other side have key shards, there is no need to enter wallet Name
      if (messageArray.some(v => v.messageContent === true)) {
        store.interactive.setOtherShard(true)
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
    store.interactive.setRecoverStep(4)
    if (
      messageArray.every(v => v.messageContent.hasMnemonic) &&
      store.interactive.mnemonic
    ) {
      await this.recoverPrepare(() => {
        store.messageModule.rpcChannel?.next({
          messageType: MPCMessageType.recoverSuccess,
          messageContent: null,
        })
      })
    } else {
      if (store.interactive.mnemonic) {
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
    if (store.interactive.mnemonic) {
      const remotePub = messageArray.find(
        v => v.messageContent.partyId === this.lostPartyInfo?.partyId
      )?.messageContent.pubKey

      if (!remotePub) return

      if (!this.remotePartyInfo || !this.lostPartyInfo) return

      const partyInfo = {
        localPartyIndex: PartyIndexMap[PartyId.A],
        remotePartyIndex: PartyIndexMap[this.remotePartyInfo.partyId],
        lostPartyIndex: PartyIndexMap[this.lostPartyInfo.partyId],
      }
      const res = await recoverContext(
        store.interactive.sessionId,
        partyInfo,
        remotePub
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
    const res = await refreshPrepare(
      store.interactive.sessionId,
      store.interactive.mnemonic,
      store.interactive.walletName
    )
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
      store.interactive.setRecoverStep(5)
      this.destroy()
    }
  }

  // --broadcast--
  async handleMnemonicSkip() {
    store.interactive.setSkip(true)
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
        store.interactive.setMnemonic(res.data)
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
      store.interactive.mnemonic
    )
    if (res.success) {
      next && next()
    }
  }

  destroy() {
    store.interactive.setProgress(0)
    store.interactive.setWalletName('')
    store.interactive.setMnemonic('')
    store.interactive.setOtherShard(false)
    store.interactive.setSkip(false)
    store.interactive.setMnemonicFormType('init')
  }
}

export default new RecoverAction()
