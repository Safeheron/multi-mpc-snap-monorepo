import { EthMethod } from '@metamask/keyring-api'

import { ComputeMessage } from '../snap-rpc'
import { BaseRelayMessage, OperationType } from './common'

export type SignPrepareParams = {
  walletId: string
  method: EthMethod
  params: string | object
  commonParams: {
    chainName: string
    chainId?: string
    balance: string
    nativeCurrency?: {
      symbol: string
      decimals: number
    }
    timestamp: number
    formatTime: string
  }
}

export type SignPrepareMessage = BaseRelayMessage<
  OperationType.signPrepare,
  undefined,
  SignPrepareParams
>

export type SignReadyMessage = BaseRelayMessage<
  OperationType.signReady,
  undefined,
  string[]
>

export type SignRoundMessage = BaseRelayMessage<
  OperationType.signRound,
  undefined,
  ComputeMessage[]
>
