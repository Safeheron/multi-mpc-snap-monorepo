import { EthMethod } from '@metamask/keyring-api'
import { SnapRpcResponse } from '@safeheron/mpcsnap-types'
import { makeAutoObservable } from 'mobx'

import { RPCChannel } from '@/service/channel/RPCChannel'
import { signApproval } from '@/service/metamask'
import { HashItemModel } from '@/service/models'
import MessageRelayer from '@/service/relayer/MessageRelayer'

export default class SignModule {
  sessionId = ''

  messageRelayer?: MessageRelayer

  pendingRequest: PendingRequest

  rpcChannel?: RPCChannel

  communicationPub = ''

  flowError = ''

  signTransactionDialogVisible = false

  signStep = 1

  txHash: HashItemModel = {} as HashItemModel

  constructor() {
    makeAutoObservable(this)
  }

  setSignTransactionDialogVisible(visible: boolean) {
    this.signTransactionDialogVisible = visible
  }

  setRPCChannel(rpcChannel: RPCChannel) {
    this.rpcChannel = rpcChannel
  }

  setSignStep(step: number) {
    this.signStep = step
  }

  setTxHash(hash) {
    this.txHash = hash
  }

  setFlowError(message: string) {
    this.flowError = message
  }

  setPendingRequest(pr: PendingRequest) {
    const { method, params } = pr
    if (method === EthMethod.SignTransaction) {
      const fixedParams = {
        ...params,
        type: parseInt('' + params.type, 16),
      }
      this.pendingRequest = { ...pr, params: fixedParams }
    } else {
      this.pendingRequest = pr
    }
  }

  async requestSignApproval(
    pendingRequest: PendingRequest,
    requestId?: string
  ): Promise<SnapRpcResponse<any>> {
    const { method, params } = pendingRequest
    this.setPendingRequest(pendingRequest)

    const res = await signApproval(method, params, requestId)
    if (res.success) {
      this.sessionId = res.data.sessionId
      this.communicationPub = res.data.pub

      this.messageRelayer = new MessageRelayer(2)

      this.setSignStep(1)
      this.signTransactionDialogVisible = true
    }
    return res
  }
}

export type PendingRequest = {
  method: EthMethod
  params: Record<string, any>
  createTime: number
  // hex-string
  chainId?: string
}
