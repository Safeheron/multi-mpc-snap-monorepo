import { heading, panel, text } from '@metamask/snaps-ui'
import { KeyGen, MPC } from '@safeheron/mpc-wasm-sdk'
import {
  AccountItem,
  ComputeMessage,
  Party,
  SnapRpcResponse,
} from '@safeheron/mpcsnap-types'
import { ethers } from 'ethers'
import { v4 as uuidV4 } from 'uuid'

import StateManager, { SnapAccount } from '@/StateManager'
import { requestConfirm } from '@/utils/snapDialog'
import { succeed } from '@/utils/snapRpcUtil'

import { BaseFlow } from './BaseFlow'

class KeyGenFlow extends BaseFlow {
  private keyGen: KeyGen

  private walletName?: string
  private signKey = ''
  private pubKey = ''

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)

    this.keyGen = mpcInstance.KeyGen.getCoSigner()
  }

  // TODO validate wallet name
  // TODO only support one wallet
  async keyGenApproval(
    walletName: string,
    party: Party
  ): Promise<SnapRpcResponse<string>> {
    await requestConfirm(
      panel([
        heading('Confirm to create an MPC wallet?'),
        text(`Wallet Name: ${walletName}`),
      ])
    )

    this.walletName = walletName
    this.sessionId = uuidV4()
    this.keyGen.setLocalParty(party.party_id, party.index)
    return succeed(this.sessionId)
  }

  async createContext(
    sessionId: string,
    remoteParties: Party[]
  ): Promise<SnapRpcResponse<ComputeMessage[]>> {
    this.verifySession(sessionId)
    const res = await this.keyGen.createContext(remoteParties)
    return succeed(res)
  }

  async runRound(sessionId: string, remoteMessageList: ComputeMessage[]) {
    this.verifySession(sessionId)

    const round = this.keyGen.lastIndex
    console.log('start keygen round', round)
    const res = await this.keyGen.runRound(remoteMessageList)
    console.log('end keygen round: ', round, res)
    if (this.keyGen.isComplete) {
      this.signKey = this.keyGen.getSignKey()
      this.pubKey = this.keyGen.getPubKey()
      return succeed({
        isComplete: this.keyGen.isComplete,
        pubKey: this.pubKey,
      })
    }
    return succeed({
      isComplete: this.keyGen.isComplete,
      message: res,
    })
  }

  async createWalletSuccess(
    sessionId: string
  ): Promise<SnapRpcResponse<AccountItem>> {
    this.verifySession(sessionId)

    // TODO validate pubkey
    const backuped = false
    const address = ethers.utils.computeAddress(`0x${this.pubKey}`)

    const snapAccount: SnapAccount = {
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
      signKey: this.signKey,
    }

    await this.stateManager.saveOrUpdateAccount(snapAccount)

    return succeed({
      walletName: this.walletName!,
      address,
      backuped,
    })
  }
}

export default KeyGenFlow
