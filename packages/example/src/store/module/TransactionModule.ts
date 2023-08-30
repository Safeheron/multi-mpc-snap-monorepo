import type { TransactionObject } from '@safeheron/mpcsnap-types'
import { BigNumber } from 'ethers'
import { makeAutoObservable } from 'mobx'

import { BaseTxObj, FeeData } from '@/service/models'
import { store } from '@/store'
import { ethers, provider, stringToHex } from '@/utils'

class TransactionModule {
  maxLength: 30
  timer: any

  baseTx: BaseTxObj = {} as BaseTxObj
  transactionObject: TransactionObject = {} as TransactionObject

  feeData: FeeData = {
    gasLimit: '21000',
  } as FeeData

  constructor() {
    makeAutoObservable(this)
  }

  setBaseTx(data) {
    this.baseTx = data
  }
  setTransactionObject(data) {
    this.transactionObject = data
  }

  async getFeeData() {
    if (!provider) return
    store.interactive.setLoading(true)
    try {
      const feeData = await provider.getFeeData()
      store.interactive.setLoading(false)
      // const maxFeePerGas = ethers.utils.formatUnits(feeData.maxFeePerGas!, 'gwei')
      const maxFeePerGas = feeData.maxFeePerGas!.toString()
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!.toString()
      if (!this.baseTx.data) {
        this.feeData = {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: '21000',
        }
      } else {
        const baseTx: BaseTxObj = {
          to: this.baseTx.to,
          value: ethers.utils.parseUnits(this.baseTx.value, 18).toHexString(),
          data: stringToHex(this.baseTx.data),
        }
        const gasLimit = (await provider.estimateGas(baseTx)).toString()
        console.log('gasLimit', gasLimit)

        this.feeData = {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit,
        }
      }
    } catch (error) {
      store.interactive.setLoading(false)
      console.error(error)
    }
  }

  get fee(): string {
    if (!this.feeData.gasLimit || !this.feeData.maxFeePerGas) {
      return '0'
    }

    return BigNumber.from(this.feeData.maxFeePerGas)
      .mul(this.feeData.gasLimit)
      .toString()
  }

  get availableBalance(): string {
    if (!store.accountModule.balance) return '0'
    if (!this.fee) return store.accountModule.balance

    const available = BigNumber.from(store.accountModule.balance).sub(this.fee)
    return available.lt(0) ? '0' : available.toString()
  }
}

export default TransactionModule
