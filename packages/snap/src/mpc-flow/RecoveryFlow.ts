import { heading, panel } from '@metamask/snaps-ui'
import {
  GeneratePubAndZkpResult,
  KeyRecovery,
  KeyRefresh,
  MPC,
  MPCHelper,
} from '@safeheron/mpc-wasm-sdk'
import {
  ComputeMessage,
  PartialShard,
  Party,
  PartyWithZkp,
  PubKey,
  SnapRpcResponse,
} from '@safeheron/mpcsnap-types'
import { ethers } from 'ethers'
import { v4 as uuidV4 } from 'uuid'

import StateManager, { SnapAccount } from '@/StateManager'
import { requestConfirm } from '@/utils/snapDialog'
import { errored, succeed } from '@/utils/snapRpcUtil'

import { BaseFlow } from './BaseFlow'

class RecoveryFlow extends BaseFlow {
  private keyRecovery: KeyRecovery
  private keyRefresh: KeyRefresh
  private mpcHelper: MPCHelper
  private signKey?: string
  private walletName?: string
  private mnemonic?: string
  private pubKey?: string
  private privKey?: string
  private remotePub?: string
  private newSignKey?: string

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)
    this.keyRecovery = mpcInstance.KeyRecovery.getCoSigner()
    this.keyRefresh = mpcInstance.KeyRefresh.getCoSigner()
    this.mpcHelper = mpcInstance.mpcHelper
  }

  async recoverApproval(): Promise<
    SnapRpcResponse<{ sessionId: string; mnemonic: string }>
  > {
    await requestConfirm(panel([heading('Confirm to recovery an MPC wallet?')]))

    this.sessionId = uuidV4()
    const wallet = this.getWalletWithError()
    this.signKey = wallet.signKey
    const res = await this.mpcHelper.extractMnemonicFromSignKey(this.signKey)
    if (res.err) {
      throw new Error(res.err.err_msg)
    }

    this.mnemonic = res.mnemo

    // TODO The mnemonic should not be returned here
    return succeed({ sessionId: this.sessionId, mnemonic: res.mnemo })
  }

  async recoverPrepare(
    sessionId: string,
    walletName: string,
    mnemonic: string
  ): Promise<SnapRpcResponse<boolean>> {
    this.verifySession(sessionId)

    this.walletName = walletName
    this.mnemonic = mnemonic
    return succeed(true)
  }

  async recoverKeyPair(sessionId: string): Promise<SnapRpcResponse<string>> {
    this.verifySession(sessionId)
    const res = await this.mpcHelper.createKeyPair()
    this.privKey = res.priv
    if (res.err) {
      throw errored(res.err.err_msg)
    }
    return succeed(res.pub)
  }

  async recoverContext(
    sessionId: string,
    partyInfo: {
      localPartyIndex: string
      remotePartyIndex: string
      lostPartyIndex: string
    },
    remotePub: string
  ): Promise<SnapRpcResponse<ComputeMessage[]>> {
    this.verifySession(sessionId)

    this.remotePub = remotePub
    const res = await this.keyRecovery.createContext(
      this.mnemonic!,
      partyInfo.localPartyIndex,
      partyInfo.remotePartyIndex,
      partyInfo.lostPartyIndex
    )
    return succeed(res)
  }

  async recoverRound(sessionId: string, remoteMessageList: ComputeMessage[]) {
    this.verifySession(sessionId)
    const round = this.keyRecovery.lastIndex

    console.log('start recovery round', round)
    const res = await this.keyRecovery.runRound(remoteMessageList)
    console.log('end recovery round', round, res)

    if (this.keyRecovery?.isComplete) {
      if (!this.remotePub) {
        throw new Error('no remotePub')
      }
      const encryptedPartySecretKey = await this.encrypt(
        this.keyRecovery.partySecretKey
      )
      return succeed({
        isComplete: this.keyRecovery.isComplete,
        partySecretKey: encryptedPartySecretKey,
        pubKeyOfThreeParty: this.keyRecovery.pubKeyOfThreeParty,
      })
    }
    return succeed({
      isComplete: this.keyRecovery?.isComplete,
      message: res,
    })
  }

  async generateMnemonic(
    sessionId: string,
    partialShards: PartialShard[],
    X: string,
    remotePubKeys: PubKey[]
  ) {
    this.verifySession(sessionId)
    const decryptedPartialShard: string[] = []

    for (const shard of partialShards) {
      const remotePub = remotePubKeys.find(
        pub => pub.partyId === shard.partyId
      )?.pubKey

      console.log('remotePub', remotePub)
      const res = await this.decrypt(shard.shard, remotePub)
      console.log('decrypt res', res)

      decryptedPartialShard.push(res)
    }
    console.log('partialShards', decryptedPartialShard)

    const res = await this.mpcHelper.aggregateKeyShard(decryptedPartialShard, X)
    console.log('generateMnemonic res', res)

    // TODO The mnemonic should not be returned here
    return succeed(res.mnemo)
  }

  async refreshPrepare(
    sessionId: string
  ): Promise<SnapRpcResponse<GeneratePubAndZkpResult>> {
    this.verifySession(sessionId)
    const res = await this.keyRefresh.generatePubAndZkp(this.mnemonic!)
    if (res.err) {
      throw new Error(res.err.err_msg)
    }
    return succeed(res)
  }

  async refreshContext(
    sessionId: string,
    localParty: Party,
    remoteParties: PartyWithZkp[]
  ): Promise<SnapRpcResponse<ComputeMessage[]>> {
    this.verifySession(sessionId)
    // TODO don't delete below line, this will be create a minimal key for key refresh
    await this.keyRefresh.generateMinimalKey(localParty, remoteParties)
    const res = await this.keyRefresh.createContext()
    return succeed(res)
  }

  async refreshRound(sessionId: string, remoteMessageList: ComputeMessage[]) {
    this.verifySession(sessionId)
    const round = this.keyRefresh.lastIndex
    console.log('start runRound', round)
    const res = await this.keyRefresh.runRound(remoteMessageList)
    console.log('runRound res', round, res)
    if (this.keyRefresh.isComplete) {
      this.newSignKey = this.keyRefresh.getSignKey()
      this.pubKey = this.keyRefresh.getPub()
      return succeed({
        isComplete: this.keyRefresh.isComplete,
        pubKey: this.pubKey,
      })
    }
    return succeed({
      isComplete: this.keyRefresh.isComplete,
      message: res,
    })
  }

  async refreshSuccess(sessionId: string) {
    const { walletName } = this
    const address = ethers.utils.computeAddress(`0x${this.pubKey}`)
    this.verifySession(sessionId)

    const backuped = Boolean(this.signKey) || Boolean(this.mnemonic)

    const oldState = this.stateManager.account
    let newState: SnapAccount
    if (oldState) {
      newState = {
        ...oldState,
        signKey: this.signKey!,
        backuped,
      }
      await this.stateManager.saveOrUpdateAccount(newState)
    } else {
      newState = {
        id: uuidV4(),
        name: this.walletName!,
        address,
        options: {},
        supportedMethods: [
          'eth_sendTransaction',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v2',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
          'eth_signTypedData',
          'personal_sign',
        ],
        type: 'eip155:eoa',
        backuped: false,
        pubkey: this.pubKey!,
        signKey: this.signKey!,
      }
      await this.stateManager.saveOrUpdateAccount(newState)
    }

    // TODO Create or update an account via the metamask account snap api

    return succeed({
      walletName,
      address,
      backuped,
    })
  }

  private async encrypt(plainText: string) {
    if (!this.privKey || !this.remotePub) {
      throw new Error('encrypt failed')
    }
    const res = await this.mpcHelper.encrypt(
      this.privKey,
      this.remotePub,
      plainText
    )
    return res.cypher
  }

  private async decrypt(cypher: string, remotePub?: string) {
    if (!this.privKey || !remotePub) {
      throw new Error('decrypt failed')
    }
    const res = await this.mpcHelper.decrypt(this.privKey, remotePub, cypher)
    return res.plain
  }
}

export default RecoveryFlow
