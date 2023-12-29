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
  RecoverContext,
  SnapRpcResponse,
} from '@safeheron/mpcsnap-types'
import { RecoverPrepare } from '@safeheron/mpcsnap-types/src'
import { ethers } from 'ethers'
import { v4 as uuidV4 } from 'uuid'

import StateManager, { SnapAccount } from '@/StateManager'
import {
  convertPlainAccount,
  convertSnapAccountToKeyringAccount,
  genWalletId,
  newSnapAccount,
  syncAccountToMetaMask,
} from '@/utils/snapAccountApi'
import { requestConfirm } from '@/utils/snapDialog'
import { errored, succeed } from '@/utils/snapRpcUtil'

import { BaseFlow } from './BaseFlow'

function normalizeMnemonic(mnemonicString: string) {
  return mnemonicString.trim().split(/\s+/).join(' ')
}

class RecoveryFlow extends BaseFlow {
  private keyRecovery?: KeyRecovery
  private keyRefresh?: KeyRefresh

  private localKeyshareExist = false
  private oldAddress = ''

  private mpcHelper: MPCHelper
  private signKey = ''
  private walletName = ''
  private mnemonic = ''
  private pubKey = ''

  private privKey?: string

  // communication pub
  private remotePub?: string
  private lostPub?: string

  private communicationPubs?: RecoverPrepare['params']['remotePubs']

  private newSignKey?: string

  private backuped = false

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)
    this.mpcHelper = mpcInstance.mpcHelper
  }

  async recoverApproval(): Promise<SnapRpcResponse<RecoverApprovalResult>> {
    await requestConfirm(panel([heading('Confirm to recover an MPC wallet?')]))

    this.backuped = false
    this.cleanup()

    this.sessionId = uuidV4()
    const wallet = this.getWallet()
    this.signKey = wallet?.signKey ?? ''
    if (wallet && this.signKey) {
      const res = await this.mpcHelper.extractMnemonicFromSignKey(this.signKey)
      if (res.err) {
        throw new Error(res.err.err_msg)
      }
      this.mnemonic = res.mnemo ?? ''
      this.backuped = true
      this.walletName = wallet.name
      this.oldAddress = wallet.address
    }

    this.keyRecovery = this.mpcInstance.KeyRecovery.getCoSigner()
    await this.keyRecovery.setupLocalCpkp()

    this.privKey = this.keyRecovery.localCommunicationPriv

    this.localKeyshareExist = !!this.signKey

    return succeed({
      sessionId: this.sessionId,
      keyshareExist: !!this.signKey,
      pub: this.keyRecovery.localCommunicationPub,
    })
  }

  async recoverPrepare(
    sessionId: string,
    walletName: string,
    remotePubs: RecoverPrepare['params']['remotePubs'],
    mnemonic?: string
  ): Promise<SnapRpcResponse<boolean>> {
    this.verifySession(sessionId)

    if (walletName.replace(/[^\x00-\xff]/g, 'aa').length > 60) {
      return errored(`Wallet name must Within 60 characters.`)
    }

    if (mnemonic && !!this.signKey) {
      return errored('Local keyshare exist. Param [mnemonic] is not needed.')
    }

    if (this.walletName && this.walletName !== walletName) {
      return errored('Keyshare in Snap exist, cannot change the wallet name.')
    }

    if (!this.walletName) {
      this.walletName = walletName
    }

    this.communicationPubs = remotePubs

    if (mnemonic) {
      this.mnemonic = normalizeMnemonic(mnemonic)
      this.backuped = true
    }
    return succeed(true)
  }

  async recoverContext(
    sessionId: string,
    localParty: RecoverContext['params']['localParty'],
    remoteParty: RecoverContext['params']['remoteParty'],
    lostParty: RecoverContext['params']['lostParty']
  ): Promise<SnapRpcResponse<ComputeMessage[]>> {
    this.verifySession(sessionId)

    this.lostPub = lostParty.pub
    this.remotePub = remoteParty.pub

    const res = await this.keyRecovery!.createContext({
      localMnemonic: this.mnemonic,
      localParty,
      remoteParty,
      lostParty,
    })
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

      const partySecretKey =
        await this.keyRecovery!.getEncryptedPartySecretKey()

      return succeed({
        isComplete: this.keyRecovery!.isComplete,
        partySecretKey,
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

    await this.keyRefresh.setupLocalCpkp({
      priv: this.keyRecovery!.localCommunicationPriv,
      pub: this.keyRecovery!.localCommunicationPub,
    })

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
    await this.keyRefresh!.generateMinimalKey(
      localParty,
      remoteParties,
      this.communicationPubs!
    )

    await this.keyRefresh?.prepareKeyGenParams()

    // Currently, We assign the key shard in Snap to A, so the remote parties index are determined
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

      const address = ethers.utils.computeAddress(`0x${this.pubKey}`)

      if (this.localKeyshareExist && address !== this.oldAddress) {
        return errored(
          'Recover failed. Recovered address does not match the old address in the keyshare, ' +
            'please make sure you enter the mnemonic phrase according to the role prompted, and make sure every word is correct.'
        )
      }

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

    const address = ethers.utils.computeAddress(`0x${this.pubKey}`)

    const oldState = this.stateManager.account

    const walletId = genWalletId(this.sessionId!, address)
    let newState: SnapAccount
    if (oldState) {
      newState = {
        ...oldState,
        signKey: this.newSignKey!,
        backuped: this.backuped,
        walletId,
      }
    } else {
      newState = newSnapAccount(
        walletId,
        this.walletName!,
        address,
        this.pubKey!,
        this.newSignKey!
      )
      newState.backuped = this.backuped
    }

    await this.stateManager.saveOrUpdateAccount(newState)

    if (this.backuped && !newState.synced) {
      const metamaskAccount = convertSnapAccountToKeyringAccount(newState)
      try {
        await syncAccountToMetaMask(metamaskAccount)

        newState.synced = true
        await this.stateManager.saveOrUpdateAccount(newState)
      } catch (e) {
        newState.synced = false
        await this.stateManager.saveOrUpdateAccount(newState)
      }
    }

    this.cleanup()

    return succeed(convertPlainAccount(newState))
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
    this.oldAddress = ''
    this.localKeyshareExist = false

    this.keyRecovery = undefined
    this.keyRefresh = undefined
  }
}

export default RecoveryFlow
