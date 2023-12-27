import type {
  BaseRelayMessage,
  ComputeMessage,
  PartialShard,
  PartyWithZkp,
  PubAndZkp,
  PubKey,
  RecoverPrepare,
  SendType,
} from '@safeheron/mpcsnap-types'
import { OperationType } from '@safeheron/mpcsnap-types'
import { RoleReadyMessage } from '@safeheron/mpcsnap-types/src'
import { message as antMessage } from 'antd'

import {
  recoverContext,
  recoverMnemonic,
  recoverPrepare,
  recoverRound,
  refreshContext,
  refreshPrepare,
  refreshRound,
  refreshSuccess,
} from '@/service/metamask'
import { getPartyId, PartyId } from '@/service/types'
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
  remotePubKeys?: PubKey[] = []

  private getPubkeyByPartyId(partyId: string) {
    return this.remotePubKeys?.find(rp => rp.partyId === partyId)?.pubKey
  }

  emitRecoveryFlowError(errMsg: string) {
    store.recoveryModule.rpcChannel?.emitAbortMessage(
      'recover',
      'error',
      errMsg
    )
  }

  sendMessage(relayMessage: BaseRelayMessage<OperationType, SendType, any>) {
    store.recoveryModule.rpcChannel?.next(relayMessage)
  }

  /**
   * 1. set remote communication public key
   * 2. re-confirm party role
   * @param messageArray
   */
  async handleRoleReady(messageArray: RoleReadyMessage[]) {
    const localKeyshareExist = store.recoveryModule.localKeyshareExist
    const otherPartiesKeyshareBothExist = messageArray.every(v =>
      Boolean(v.messageContent.hasKeyShare)
    )
    // has 3 keyShard, does not need to recover.
    if (otherPartiesKeyshareBothExist && localKeyshareExist) {
      // If both side have key shards, don't needed recovery
      store.recoveryModule.setMnemonicFormType('noNeed')
      return
    }

    // Check wallet id in case user use different wallet to recover
    let walletIdArray = messageArray.map(m => m.messageContent.walletId)
    walletIdArray.push(store.accountModule.walletId)
    walletIdArray = walletIdArray.filter(Boolean)
    if (walletIdArray && walletIdArray.length >= 2) {
      const firstEle = walletIdArray[0]
      const walletMatched = walletIdArray.every(wi => wi === firstEle)
      if (!walletMatched) {
        antMessage.error(
          `Wallet not matched, it seems that you are using different wallet to perform recover. These wallet IDs are ${walletIdArray.join(
            ', '
          )}`,
          5
        )

        this.emitRecoveryFlowError('Wallet not match, cancel the recover flow.')
        store.recoveryModule.setRecoverDialogVisible(false)
        return
      }
    }

    /**
     * Confirm remote party communication pub, there are 3 types, include 7 enumerable states
     *
     * ① Both remote parties have private key shards
     *  -- [{index: 2, partyId: B}, {index: 3, partyId: C}]
     *  -- [{index: 2, partyId: C}, {index: 3, partyId: B}]
     *
     * ② Both remote parties not have private key shards
     * -- [{index: 2, partyId: undefined}, {index: 3, partyId: undefined}]
     *
     * ③ Only one remote parties have private key shards
     * -- [{index: 2, partyId: B}, {index: 3, partyId: undefined}]
     * -- [{index: 2, partyId: C}, {index: 3, partyId: undefined}]
     * -- [{index: 2, partyId: undefined}, {index: 3, partyId: B}]
     * -- [{index: 2, partyId: undefined}, {index: 3, partyId: C}]
     *
     */
    const otherPartiesBothHaveNotKeyshares = messageArray.every(
      v => !Boolean(v.messageContent.hasKeyShare)
    )
    if (otherPartiesKeyshareBothExist) {
      this.remotePubKeys = messageArray.map(ma => ({
        partyId: ma.messageContent.partyId as PartyId,
        pubKey: ma.messageContent.pub,
      }))
    } else if (otherPartiesBothHaveNotKeyshares) {
      // @ts-ignore
      this.remotePubKeys = messageArray.map(ma => {
        return {
          partyId: getPartyId(ma.messageContent.index),
          pubKey: ma.messageContent.pub,
        }
      })
    } else {
      const fixedRemoteParty = messageArray.find(
        ma => ma.messageContent.partyId
      )
      const notFixedRemoteParty = messageArray.find(
        ma => !ma.messageContent.partyId
      )

      const fixedPartyId = fixedRemoteParty!.messageContent.partyId as PartyId
      const fixedPartyPub = fixedRemoteParty!.messageContent.pub

      const notFixedPartyId = fixedPartyId === PartyId.B ? PartyId.C : PartyId.B
      const notFixedPartyPub = notFixedRemoteParty!.messageContent.pub
      this.remotePubKeys = [
        { partyId: fixedPartyId, pubKey: fixedPartyPub },
        { partyId: notFixedPartyId, pubKey: notFixedPartyPub },
      ]
    }

    // setup walletName
    if (localKeyshareExist) {
      // If I have private key shards on my side
      store.recoveryModule.setWalletName(store.accountModule.walletName)
      store.recoveryModule.setMnemonicFormType('done')
      this.sendMessage({
        messageType: OperationType.mnemonicReady,
        messageContent: {
          hasMnemonic: true,
          walletName: store.recoveryModule.walletName,
          partyId: PartyId.A,
        },
      })
      return
    }

    // If I don't have a private key shard, jump to enter the mnemonic step
    store.recoveryModule.setMnemonicFormType('init')
    // If other side has key shards, there is no need to enter wallet Name
    if (messageArray.some(v => Boolean(v.messageContent.hasKeyShare))) {
      store.recoveryModule.setOtherShard(true)
    }
  }

  /**
   * 1. determine the recovered party based on the hasMnemonic field
   * 2. determine each party to go refresh step based on mnemonic number
   * @param messageArray
   */
  async handleMnemonicReady(
    messageArray: MPCMessage<{
      hasMnemonic: boolean
      walletName?: string
      partyId: PartyId
    }>[]
  ) {
    if (!store.recoveryModule.walletName) {
      const walletName = messageArray.find(v => v.messageContent.walletName)
        ?.messageContent.walletName
      store.recoveryModule.setWalletName(walletName!)
    }
    store.recoveryModule.setRecoverStep(4)

    const otherPartiesHasMnemonic = messageArray.every(
      v => v.messageContent.hasMnemonic
    )

    const remotePubs: RecoverPrepare['params']['remotePubs'] =
      this.remotePubKeys!.map(rp => ({
        partyId: rp.partyId,
        pub: rp.pubKey,
      }))

    const recoverPrepareRes = await recoverPrepare(
      store.recoveryModule.sessionId,
      store.recoveryModule.walletName,
      remotePubs,
      store.recoveryModule.inputMnemonic
    )
    if (!recoverPrepareRes.success) {
      this.emitRecoveryFlowError(
        recoverPrepareRes.errMsg ??
          'Recovery flow error: call recoverPrepare failed.'
      )
    }

    // has three mnemonic, go to refresh step
    if (otherPartiesHasMnemonic && store.recoveryModule.localPartyHasMnemonic) {
      this.sendMessage({
        messageType: OperationType.recoverSuccess,
        messageContent: null,
      })
      return
    }

    if (!store.recoveryModule.localPartyHasMnemonic) {
      /* DO NOTHING, just wait recover data from other two parties */
      return
    }

    // local party has mnemonic, need to run mpc-recover-protocol
    // and then find the lost party
    const remoteParty = messageArray.find(v => v.messageContent.hasMnemonic)

    const lostParty = messageArray.find(v => !v.messageContent.hasMnemonic)

    if (!remoteParty || !lostParty) {
      this.emitRecoveryFlowError('remote party number error')
      return
    }

    this.remotePartyInfo = {
      partyId: remoteParty.messageContent.partyId,
      name: remoteParty.from,
    }
    this.lostPartyInfo = {
      partyId: lostParty.messageContent.partyId,
      name: lostParty.from,
    }

    const localParty = {
      partyId: PartyId.A,
      index: PartyIndexMap[PartyId.A],
    }

    const remotePartyData = {
      partyId: this.remotePartyInfo.partyId,
      index: PartyIndexMap[this.remotePartyInfo.partyId],
      pub: this.getPubkeyByPartyId(this.remotePartyInfo.partyId)!,
    }

    const lostPartyData = {
      partyId: this.lostPartyInfo.partyId,
      index: PartyIndexMap[this.lostPartyInfo.partyId],
      pub: this.getPubkeyByPartyId(this.lostPartyInfo.partyId)!,
    }

    const res = await recoverContext(
      store.recoveryModule.sessionId,
      localParty,
      remotePartyData,
      lostPartyData
    )
    if (res.success) {
      this.sendMessage({
        messageType: OperationType.recoverRound,
        messageContent: res.data,
        to: this.remotePartyInfo.name,
      })
    } else {
      this.emitRecoveryFlowError(
        res.errMsg ??
          'Recover flow error: call recoverContext rpc method failed'
      )
    }
  }

  /**
   * receive remote recover round message and run local mpc-recoverRound protocol
   * @param message
   */
  async handleRecoverRound(message: MPCMessage<ComputeMessage[]>) {
    const res = await recoverRound(
      store.recoveryModule.sessionId,
      message.messageContent
    )
    if (res.success) {
      if (res.data?.isComplete) {
        this.sendMessage({
          messageType: OperationType.partySecretKeyReady,
          messageContent: {
            partyId: PartyId.A,
            partySecretKey: res.data.partySecretKey,
            pubKeyOfThreeParty: res.data.pubKeyOfThreeParty,
          },
          to: this.lostPartyInfo?.name,
          sendType: 'p2p',
        })

        this.sendMessage({
          messageType: OperationType.recoverSuccess,
          messageContent: null,
        })
      } else {
        this.sendMessage({
          messageType: OperationType.recoverRound,
          messageContent: res.data?.message,
          to: this.remotePartyInfo?.name,
        })
      }
    } else {
      this.emitRecoveryFlowError(
        res.errMsg ?? 'Recover flow error: call recoverRound rpc method failed.'
      )
    }
  }

  async handleRecoverSuccess() {
    const res = await refreshPrepare(store.recoveryModule.sessionId)
    if (res.success) {
      this.sendMessage({
        messageType: OperationType.refreshReady,
        messageContent: {
          X: res.data?.X,
          dlog_zkp: res.data?.dlog_zkp,
          partyId: PartyId.A,
        },
      })
    } else {
      this.emitRecoveryFlowError(
        res.errMsg ??
          'Recovery flow error: call refreshPrepare rpc method failed.'
      )
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
      store.recoveryModule.sessionId,
      {
        party_id: PartyId.A,
        index: PartyIndexMap[PartyId.A],
      },
      remoteParties
    )
    if (res.success) {
      this.sendMessage({
        messageType: OperationType.refreshRound,
        messageContent: res.data,
      })
    } else {
      this.emitRecoveryFlowError(
        'Recover flow error: call refreshContext rpc method failed.'
      )
    }
  }

  async handleRefreshRound(messageArray: MPCMessage<ComputeMessage[]>[]) {
    const remoteMessageList = messageArray.map(
      v =>
        v.messageContent.find(
          msg => msg.destination === PartyId.A
        ) as ComputeMessage
    )

    const res = await refreshRound(
      store.recoveryModule.sessionId,
      remoteMessageList
    )
    if (res.success) {
      if (res.data.isComplete) {
        this.sendMessage({
          messageType: OperationType.refreshSuccess,
          messageContent: null,
        })
      } else {
        // continue round
        this.sendMessage({
          messageType: OperationType.refreshRound,
          messageContent: res.data?.message,
        })
      }
    } else {
      this.emitRecoveryFlowError(
        res.errMsg ?? 'Recovery Flow: call refreshRound rpc method failed.'
      )
    }
  }

  async handleRefreshSuccess() {
    const res = await refreshSuccess(store.recoveryModule.sessionId)
    if (res.success) {
      store.accountModule.setAccount(res.data)
      store.recoveryModule.setRecoverStep(5)
      reportRecoverSuccess(res.data.address, res.data.id, res.data.walletName)
      this.destroy()
    } else {
      this.emitRecoveryFlowError(
        res.errMsg ??
          'Recovery flow error: call refreshSuccess rpc method failed.'
      )
    }
  }

  // --broadcast--
  async handleMnemonicSkip() {
    store.recoveryModule.setSkip(true)
  }

  /**
   * aggregate self mnemonic with other two parties recovered secret key
   * @param message
   */
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
    // this.pubKeyOfThreeParty = pubKeyOfThreeParty

    if (this.partySecretKeys.length === 2) {
      const res = await recoverMnemonic(
        store.recoveryModule.sessionId,
        this.partySecretKeys,
        pubKeyOfThreeParty,
        this.remotePubKeys!
      )

      if (res.success) {
        this.sendMessage({
          messageType: OperationType.recoverSuccess,
          messageContent: null,
        })
      } else {
        this.emitRecoveryFlowError(
          res.errMsg ?? 'Recover flow error: generate mnemonic failed.'
        )
      }
    }
  }

  destroy() {
    store.interactive.setProgress(0)
    store.recoveryModule.setWalletName('')

    store.recoveryModule.setInputMnemonic('')
    store.recoveryModule.setOtherShard(false)
    store.recoveryModule.setSkip(false)
    store.recoveryModule.setMnemonicFormType('init')
  }

  cleanup() {
    this.partySecretKeys = []
    this.remotePartyInfo = undefined
    this.lostPartyInfo = undefined
    this.remotePubKeys = []
  }
}

export default new RecoverAction()
