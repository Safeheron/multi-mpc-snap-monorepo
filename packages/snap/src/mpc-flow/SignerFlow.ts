import { heading, panel, text } from '@metamask/snaps-ui'
import { MPC, Signer } from '@safeheron/mpc-wasm-sdk'
import { ComputeMessage, SnapRpcResponse } from '@safeheron/mpcsnap-types'
import { BigNumber, ethers, UnsignedTransaction } from 'ethers'
import { v4 as uuidV4 } from 'uuid'

import StateManager from '@/StateManager'
import { requestConfirm } from '@/utils/snapDialog'
import { succeed } from '@/utils/snapRpcUtil'

import { BaseFlow } from './BaseFlow'

class KeyGenFlow extends BaseFlow {
  private signer: Signer
  private transactionObject?: Record<string, any>
  private unsignedTransaction?: UnsignedTransaction
  private signKey?: string

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)
    this.signer = mpcInstance.Signer.getCoSigner()
  }

  /**
   * TODO support message sign
   * TODO need wallet id param and request id param
   * @param transactionObject
   */
  async signApproval(
    transactionObject: Record<string, any>
  ): Promise<SnapRpcResponse<string>> {
    const wallet = this.getWalletWithError()

    const jsonList = Object.keys(transactionObject).map(key =>
      text(`${key}: ${transactionObject[key]}`)
    )

    // TODO validate request id

    await requestConfirm(
      panel([
        heading('Confirm to sign this transaction?'),
        text(' '),
        ...jsonList,
      ])
    )

    this.sessionId = uuidV4()
    this.transactionObject = transactionObject
    this.signKey = wallet.signKey

    return succeed(this.sessionId)
  }

  async createContext(
    sessionId: string,
    participantsPartyIds: string[]
  ): Promise<SnapRpcResponse<ComputeMessage[]>> {
    this.verifySession(sessionId)

    const hash = this.serializeUnsignedTransaction(this.transactionObject!)
    const res = await this.signer.createContext(
      hash,
      this.signKey!,
      participantsPartyIds
    )
    return succeed(res)
  }

  async runRound(sessionId: string, remoteMessageList: ComputeMessage[]) {
    this.verifySession(sessionId)

    const round = this.signer.lastIndex

    console.log('start sign round: ', round)
    const res = await this.signer.runRound(remoteMessageList)
    console.log('end sign round: ', round, res)

    // TODO resolve transaction
    if (this.signer.isComplete) {
      const signedTransaction = this.serializeTransaction(
        this.signer.getSignature()
      )
      return succeed({
        isComplete: this.signer.isComplete,
        signedTransaction: signedTransaction,
      })
    }
    return succeed({
      isComplete: this.signer.isComplete,
      message: res,
    })
  }

  private serializeUnsignedTransaction(
    transactionObject: Record<string, any>
  ): string {
    // TODO just use needed field
    const unsignedTransaction: UnsignedTransaction = {
      ...transactionObject,
      value: ethers.utils
        .parseUnits(`${transactionObject.value}`, 18)
        .toHexString(),
      data: transactionObject.data
        ? ethers.utils.isHexString(transactionObject.data)
          ? transactionObject.data
          : ethers.utils.hexlify(
              ethers.utils.toUtf8Bytes(`${transactionObject.data}`)
            )
        : '',
      gasLimit: BigNumber.from(transactionObject.gasLimit).toHexString(),
      maxFeePerGas: ethers.utils
        .parseUnits(`${transactionObject.maxFeePerGas}`, 'gwei')
        .toHexString(),
      maxPriorityFeePerGas: ethers.utils
        .parseUnits(`${transactionObject.maxPriorityFeePerGas}`, 'gwei')
        .toHexString(),
      type: transactionObject.type || 2,
    }

    console.log('transactionObject', this.transactionObject)
    this.unsignedTransaction = unsignedTransaction
    console.log('unsignedTransaction', unsignedTransaction)

    const serializedTransaction =
      ethers.utils.serializeTransaction(unsignedTransaction)
    let unsignedTxHash = ethers.utils.keccak256(serializedTransaction)
    if (unsignedTxHash.startsWith('0x')) {
      unsignedTxHash = unsignedTxHash.substring(2)
    }
    return unsignedTxHash
  }

  private padHexPrefix(value: string) {
    return ethers.utils.isHexString(value) ? value : '0x' + value
  }

  private serializeTransaction(sig): string {
    console.log('r s v', sig)

    const { r, s, v } = sig
    const signature = {
      r: this.padHexPrefix(r),
      s: this.padHexPrefix(s),
      recoveryParam: v,
    }

    // TODO removed or replace a standard logger
    console.log('serializeTransaction signature', signature)
    console.log(
      'serializeTransaction unsignedTransaction',
      this.unsignedTransaction
    )

    return ethers.utils.serializeTransaction(
      this.unsignedTransaction!,
      signature
    )
  }
}

export default KeyGenFlow
