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
  RecoverApprovalResult,
  SnapRpcResponse,
} from '@safeheron/mpcsnap-types'
import { ethers } from 'ethers'
import { v4 as uuidV4 } from 'uuid'

import StateManager, { SnapAccount } from '@/StateManager'
import {
  convertSnapAccountToKeyringAccount,
  newSnapAccount,
  syncAccountToMetaMask,
} from '@/utils/snapAccountApi'
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

  private backuped = false

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)
    this.mpcHelper = mpcInstance.mpcHelper
  }

  async recoverApproval(): Promise<SnapRpcResponse<RecoverApprovalResult>> {
    await requestConfirm(panel([heading('Confirm to recover an MPC wallet?')]))
    this.cleanup()

    this.sessionId = uuidV4()
    const wallet = this.getWallet()
    this.signKey = wallet?.signKey ?? ''
    if (this.signKey) {
      const res = await this.mpcHelper.extractMnemonicFromSignKey(this.signKey)
      if (res.err) {
        throw new Error(res.err.err_msg)
      }
      this.mnemonic = res.mnemo ?? ''
      this.backuped = true
    }

    this.keyRecovery = this.mpcInstance.KeyRecovery.getCoSigner()

    return succeed({ sessionId: this.sessionId, keyshareExist: !!this.signKey })
  }

  async recoverPrepare(
    sessionId: string,
    walletName: string,
    mnemonic?: string
  ): Promise<SnapRpcResponse<boolean>> {
    this.verifySession(sessionId)

    if (walletName.replace(/[^\x00-\xff]/g, 'aa').length > 60) {
      return errored(`Wallet name must Within 60 characters.`)
    }

    if (mnemonic && !!this.signKey) {
      return errored('Local keyshare exist. Param [mnemonic] is not needed.')
    }

    this.walletName = walletName
    if (mnemonic) {
      this.mnemonic = mnemonic
      this.backuped = true
    }
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

      const res = await this.decrypt(shard.shard, remotePub)

      decryptedPartialShard.push(res)
    }

    const res = await this.mpcHelper.aggregateKeyShard(decryptedPartialShard, X)
    if (res.err) {
      return errored('cannot aggregate keyshard.')
    }
    this.mnemonic = res.mnemo

    return succeed('')
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

    const oldState = this.stateManager.account

    let newState: SnapAccount
    if (oldState) {
      newState = {
        ...oldState,
        signKey: this.newSignKey!,
        backuped: this.backuped,
      }
    } else {
      newState = newSnapAccount(
        this.walletName!,
        address,
        this.pubKey!,
        this.newSignKey!
      )
      newState.backuped = this.backuped
    }

    await this.stateManager.saveOrUpdateAccount(newState)

    if (this.backuped) {
      const metamaskAccount = convertSnapAccountToKeyringAccount(newState)
      await syncAccountToMetaMask(metamaskAccount)
    }

    this.cleanup()

    return succeed({
      walletName,
      address,
      backuped: this.backuped,
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

  private cleanup() {
    this.sessionId = ''
    this.walletName = ''
    this.pubKey = ''
    this.privKey = ''
    this.remotePub = ''
    this.newSignKey = ''
    this.mnemonic = ''

    this.keyRecovery = undefined
    this.keyRefresh = undefined
  }
}

export default RecoveryFlow
