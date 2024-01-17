import { emitSnapKeyringEvent, KeyringEvent } from '@metamask/keyring-api'
import { MPC, Signer } from '@safeheron/mpc-wasm-sdk'
import {
  ComputeMessage,
  KeyringAccountSupportedMethods,
  SignApprovalResult,
  SnapRpcResponse,
  TransactionObject,
} from '@safeheron/mpcsnap-types'
import { ethers, UnsignedTransaction } from 'ethers'
import { v4 as uuidV4 } from 'uuid'

import StateManager from '@/StateManager'
import { serialize } from '@/utils/serializeUtil'
import { succeed } from '@/utils/snapRpcUtil'
import { normalizeTx, trimNullableProperty } from '@/utils/transactionUtil'

import { BaseFlow } from './BaseFlow'

function isTransaction(method: KeyringAccountSupportedMethods) {
  return method === 'eth_signTransaction'
}

class KeyGenFlow extends BaseFlow {
  private signer?: Signer

  private requestOrigin: 'metamask' | 'website' = 'website'
  private metamaskRequestId?: string
  private signMethod?: KeyringAccountSupportedMethods
  private signParams?: Record<string, any> | string

  private normalizedTx?: UnsignedTransaction
  private signKey?: string

  constructor(stateManager: StateManager, mpcInstance: MPC) {
    super(stateManager, mpcInstance)
  }

  /**
   * @param method
   * @param params
   * @param requestId
   */
  async signApproval(
    method: KeyringAccountSupportedMethods,
    params: Record<string, any> | string,
    requestId?: string
  ): Promise<SnapRpcResponse<SignApprovalResult>> {
    const wallet = this.getWalletWithError()

    if (requestId) {
      const requestIdIsValid = this.stateManager.isValidRequest(requestId)
      if (!requestIdIsValid) {
        throw new Error('Invalid request id: ' + requestId)
      }
      this.metamaskRequestId = requestId
    }

    this.sessionId = uuidV4()
    this.requestOrigin = Boolean(requestId) ? 'metamask' : 'website'
    this.signMethod = method
    this.signParams = params
    if (isTransaction(this.signMethod!)) {
      this.normalizedTx = normalizeTx(params as TransactionObject)
    }
    this.signKey = wallet.signKey

    this.signer = this.mpcInstance.Signer.getCoSigner()
    await this.signer.setupLocalCpkp()

    return succeed({
      sessionId: this.sessionId,
      pub: this.signer.localCommunicationPub,
    })
  }

  async createContext(
    sessionId: string,
    participantsPartyIds: string[],
    remotePub: { partyId: string; pub: string }
  ): Promise<SnapRpcResponse<ComputeMessage[]>> {
    this.verifySession(sessionId)

    const hash = this.serialized()
    console.log('serialized hash: ', hash)

    const res = await this.signer!.createContext(
      hash,
      this.signKey!,
      participantsPartyIds,
      remotePub
    )
    return succeed(res)
  }

  async runRound(sessionId: string, remoteMessageList: ComputeMessage[]) {
    this.verifySession(sessionId)

    const res = await this.signer!.runRound(remoteMessageList)
    const isComplete = this.signer!.isComplete

    if (isComplete) {
      const signature = this.signer!.getSignature()
      if (this.requestOrigin === 'metamask') {
        const { r, s, v } = signature
        const { maxFeePerGas, chainId } = this.signParams as Record<string, any>
        let resultSig: any
        if (isTransaction(this.signMethod!)) {
          const isEip1559 = Boolean(maxFeePerGas)

          // Fixed Metamask validate
          const recoveryId =
            chainId !== undefined
              ? BigInt(v + 35) + BigInt(chainId) * BigInt(2)
              : v + 27

          resultSig = trimNullableProperty({
            ...(this.signParams as Record<string, any>),
            r: this.padHexPrefix(r),
            s: this.padHexPrefix(s),
            v: isEip1559
              ? this.padHexPrefix(v.toString(16))
              : this.padHexPrefix(recoveryId.toString(16)),
            chainId: ethers.BigNumber.from(chainId).toHexString(),
          })

          console.log('signed transaction for metamask request >> ', resultSig)
        } else {
          resultSig = `0x${r}${s}${(v + 27).toString(16).padStart(2, '0')}`
        }

        await this.stateManager.deleteRequest(this.metamaskRequestId!)
        try {
          await emitSnapKeyringEvent(snap, KeyringEvent.RequestApproved, {
            id: this.metamaskRequestId!,
            result: resultSig,
          })
        } catch (e) {
          /* do nothing */
        }

        this.cleanup()
        return succeed({
          isComplete,
        })
      } else {
        const signedTransaction =
          this.serializeTransactionWithSignature(signature)

        this.cleanup()
        return succeed({
          isComplete,
          signedTransaction: signedTransaction,
        })
      }
    }

    return succeed({
      isComplete,
      message: res,
    })
  }

  private serialized() {
    return serialize(this.signMethod!, this.signParams!)
  }

  private padHexPrefix(value: string) {
    return ethers.utils.isHexString(value) ? value : '0x' + value
  }

  private serializeTransactionWithSignature(sig: {
    r: string
    s: string
    v: number
  }): string {
    const { r, s, v } = sig
    const signature = {
      r: this.padHexPrefix(r),
      s: this.padHexPrefix(s),
      recoveryParam: v,
    }

    return ethers.utils.serializeTransaction(this.normalizedTx!, signature)
  }

  private cleanup() {
    this.signer = undefined
    this.signKey = ''
  }
}

export default KeyGenFlow
