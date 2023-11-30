import type { TransactionObject } from '@safeheron/mpcsnap-types'
import { BigNumber } from 'ethers'
import { makeAutoObservable } from 'mobx'

import { BaseTxObj, FeeData } from '@/service/models'
import { store } from '@/store'
import { ethers, getProvider, stringToHex } from '@/utils'

class TransactionModule {
  maxLength: 30

  baseTx: BaseTxObj = {} as BaseTxObj
  transactionObject: TransactionObject = {} as TransactionObject

  feeDataLoading = false
  feeData: FeeData = {
    gasLimit: '21000',
  } as FeeData

  sendDialogVisible = false
  sendFormCompleted = false

  constructor() {
    makeAutoObservable(this)
  }

  setSendDialogVisible(value: boolean) {
    this.sendDialogVisible = value
  }

  setSendFormCompleted(value: boolean) {
    this.sendFormCompleted = value
  }

  setBaseTx(data) {
    this.baseTx = data
  }
  setTransactionObject(data) {
    this.transactionObject = data
  }

  async getFeeData() {
    const provider = getProvider()

    this.feeDataLoading = true
    try {
      const feeData = await provider.getFeeData()
      const maxFeePerGas = feeData.maxFeePerGas?.toString() ?? ''
      const maxPriorityFeePerGas =
        feeData.maxPriorityFeePerGas?.toString() ?? ''
      const gasPrice = feeData.gasPrice?.toString() ?? ''

      if (!this.baseTx.data) {
        this.feeData = {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasPrice,
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
          gasPrice,
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit,
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      this.feeDataLoading = false
    }
  }

  get fee(): string {
    if (!this.feeData.gasLimit) {
      return '0'
    }

    if (this.feeData.maxFeePerGas) {
      return BigNumber.from(this.feeData.maxFeePerGas)
        .mul(this.feeData.gasLimit)
        .toString()
    }

    if (this.feeData.gasPrice) {
      return BigNumber.from(this.feeData.gasPrice)
        .mul(this.feeData.gasLimit)
        .toString()
    }

    return '0'
  }

  get availableBalance(): string {
    if (!store.accountModule.balance) return '0'
    if (!this.fee) return store.accountModule.balance

    const available = BigNumber.from(store.accountModule.balance).sub(this.fee)
    return available.lt(0) ? '0' : available.toString()
  }
}

export default TransactionModule
