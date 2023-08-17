import { heading, panel, text } from '@metamask/snaps-ui'
import { KeyGen, MPC } from '@safeheron/mpc-wasm-sdk'
import {
  AccountItem,
  ComputeMessage,
  CreateApprovalResult,
  Party,
  PartyWithPub,
  SnapRpcResponse,
} from '@safeheron/mpcsnap-types'
import { ethers } from 'ethers'
import { v4 as uuidV4 } from 'uuid'

import StateManager, { SnapAccount } from '@/StateManager'
import {
  convertPlainAccount,
  genWalletId,
  newSnapAccount,
} from '@/utils/snapAccountApi'
import { requestConfirm } from '@/utils/snapDialog'
import { errored, succeed } from '@/utils/snapRpcUtil'

import { BaseFlow } from './BaseFlow'

class KeyGenFlow extends BaseFlow {
  private keyGen?: KeyGen

  private walletName?: string
  private signKey = ''
  private pubKey = ''

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)
  }

  async keyGenApproval(
    walletName: string,
    party: Party
  ): Promise<SnapRpcResponse<CreateApprovalResult>> {
    if (walletName.replace(/[^\x00-\xff]/g, 'aa').length > 60) {
      return errored(`Wallet name must within 60 characters.`)
    }

    const existWallet = this.getWallet()
    if (existWallet) {
      return errored('Wallet exist. Can not create one more wallet.')
    }

    await requestConfirm(
      panel([
        heading('Confirm to create an MPC wallet?'),
        text(`Wallet Name: ${walletName}`),
      ])
    )

    this.keyGen = this.mpcInstance.KeyGen.getCoSigner()

    await this.keyGen.setupLocalCpkp()

    this.walletName = walletName
    this.sessionId = uuidV4()
    this.keyGen!.setLocalParty(party.party_id, party.index)

    return succeed({
      sessionId: this.sessionId,
      pub: this.keyGen.localCommunicationPub,
    })
  }

  async createContext(
    sessionId: string,
    remoteParties: PartyWithPub[]
  ): Promise<SnapRpcResponse<ComputeMessage[]>> {
    this.verifySession(sessionId)
    const res = await this.keyGen!.createContext(remoteParties)
    return succeed(res)
  }

  async runRound(sessionId: string, remoteMessageList: ComputeMessage[]) {
    this.verifySession(sessionId)

    const round = this.keyGen!.lastIndex
    console.log('start keygen round', round, remoteMessageList)
    const res = await this.keyGen!.runRound(remoteMessageList)
    console.log('end keygen round: ', round, res)
    if (this.keyGen!.isComplete) {
      this.signKey = this.keyGen!.getSignKey()
      this.pubKey = this.keyGen!.getPubKey()
      return succeed({
        isComplete: this.keyGen!.isComplete,
        pubKey: this.pubKey,
      })
    }
    return succeed({
      isComplete: this.keyGen!.isComplete,
      message: res,
    })
  }

  async createWalletSuccess(
    sessionId: string
  ): Promise<SnapRpcResponse<AccountItem>> {
    this.verifySession(sessionId)

    const address = ethers.utils.computeAddress(`0x${this.pubKey}`)

    const walletId = genWalletId(this.sessionId!, address)
    const snapAccount: SnapAccount = newSnapAccount(
      walletId,
      this.walletName!,
      address,
      this.pubKey!,
      this.signKey
    )

    await this.stateManager.saveOrUpdateAccount(snapAccount)

    this.cleanup()

    return succeed(convertPlainAccount(snapAccount))
  }

  private cleanup() {
    this.signKey = ''
    this.keyGen = undefined
    this.sessionId = ''
    this.walletName = ''
    this.pubKey = ''
  }
}

export default KeyGenFlow
