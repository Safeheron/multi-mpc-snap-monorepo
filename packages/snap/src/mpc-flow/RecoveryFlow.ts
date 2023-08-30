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
import { SUPPORTED_METHODS } from '@/utils/configs'
import { convertAccount, syncAccountToMetaMask } from '@/utils/snapAccountApi'
import { requestConfirm } from '@/utils/snapDialog'
import { errored, succeed } from '@/utils/snapRpcUtil'

import { BaseFlow } from './BaseFlow'

class RecoveryFlow extends BaseFlow {
  private keyRecovery?: KeyRecovery
  private keyRefresh?: KeyRefresh
  private mpcHelper: MPCHelper
  private signKey = ''
  private walletName = ''
  private mnemonic = ''
  private pubKey = ''
  private privKey?: string
  private remotePub?: string
  private newSignKey?: string

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)
    this.mpcHelper = mpcInstance.mpcHelper
  }

  async recoverApproval(): Promise<
    SnapRpcResponse<{ sessionId: string; mnemonic: string }>
  > {
    await requestConfirm(panel([heading('Confirm to recovery an MPC wallet?')]))

    this.walletName = ''
    this.pubKey = ''
    this.privKey = ''
    this.remotePub = ''
    this.newSignKey = ''

    this.sessionId = uuidV4()
    const wallet = this.getWallet()
    this.signKey = wallet?.signKey ?? ''
    if (this.signKey) {
      const res = await this.mpcHelper.extractMnemonicFromSignKey(this.signKey)
      if (res.err) {
        throw new Error(res.err.err_msg)
      }
      this.mnemonic = res.mnemo ?? ''
    }

    this.keyRecovery = this.mpcInstance.KeyRecovery.getCoSigner()

    // TODO The mnemonic should not be returned here
    return succeed({ sessionId: this.sessionId, mnemonic: this.mnemonic })
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
    const keypair = await this.mpcHelper.createKeyPair()
    this.privKey = keypair.priv
    if (keypair.err) {
      throw errored(keypair.err.err_msg)
    }
    return succeed(keypair.pub)
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
    const res = await this.keyRecovery!.createContext(
      this.mnemonic!,
      partyInfo.localPartyIndex,
      partyInfo.remotePartyIndex,
      partyInfo.lostPartyIndex
    )
    return succeed(res)
  }

  async recoverRound(sessionId: string, remoteMessageList: ComputeMessage[]) {
    this.verifySession(sessionId)
    const round = this.keyRecovery!.lastIndex

    console.log('start recovery round', round)
    const res = await this.keyRecovery!.runRound(remoteMessageList)
    console.log('end recovery round', round, res)

    if (this.keyRecovery!.isComplete) {
      if (!this.remotePub) {
        throw new Error('no remotePub')
      }
      const encryptedPartySecretKey = await this.encrypt(
        this.keyRecovery!.partySecretKey
      )
      return succeed({
        isComplete: this.keyRecovery!.isComplete,
        partySecretKey: encryptedPartySecretKey,
        pubKeyOfThreeParty: this.keyRecovery!.pubKeyOfThreeParty,
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
    this.keyRefresh = this.mpcInstance.KeyRefresh.getCoSigner()
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

    // Don't delete below line, this will create a minimal key for key refresh
    await this.keyRefresh!.generateMinimalKey(localParty, remoteParties)

    const res = await this.keyRefresh!.createContext()
    return succeed(res)
  }

  async refreshRound(sessionId: string, remoteMessageList: ComputeMessage[]) {
    this.verifySession(sessionId)
    const round = this.keyRefresh!.lastIndex
    console.log('start runRound', round)
    const res = await this.keyRefresh!.runRound(remoteMessageList)
    console.log('runRound res', round, res)
    if (this.keyRefresh!.isComplete) {
      this.newSignKey = this.keyRefresh!.getSignKey()
      this.pubKey = this.keyRefresh!.getPub()
      return succeed({
        isComplete: this.keyRefresh!.isComplete,
        pubKey: this.pubKey,
      })
    }
    return succeed({
      isComplete: this.keyRefresh!.isComplete,
      message: res,
    })
  }

  async refreshSuccess(sessionId: string) {
    this.verifySession(sessionId)

    const { walletName } = this
    const address = ethers.utils.computeAddress(`0x${this.pubKey}`)

    const backuped = Boolean(this.signKey) || Boolean(this.mnemonic)

    const oldState = this.stateManager.account

    let newState: SnapAccount
    if (oldState) {
      newState = {
        ...oldState,
        signKey: this.newSignKey!,
        backuped,
      }
    } else {
      newState = {
        id: uuidV4(),
        name: this.walletName!,
        address,
        options: {},
        supportedMethods: SUPPORTED_METHODS,
        type: 'eip155:eoa',
        backuped: false,
        pubkey: this.pubKey!,
        signKey: this.newSignKey!,
      }
    }

    await this.stateManager.saveOrUpdateAccount(newState)

    if (backuped) {
      const metamaskAccount = convertAccount(newState)
      await syncAccountToMetaMask(metamaskAccount)
    }

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
