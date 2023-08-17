import type { TransactionObject } from '@safeheron/mpcsnap-types'
import { BigNumber } from 'ethers'
import { makeAutoObservable } from 'mobx'

import { TransactionStatusEnum } from '@/configs/Enums'
import { BaseTxObj, FeeData, TxRecordItem } from '@/service/models'
import { store } from '@/store'
import { ethers, provider, stringToHex } from '@/utils'
import StorageUtil from '@/utils/StorageUtil'

class TransactionModule {
  transactionList: TxRecordItem[] = []
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

  getTransactionList() {
    const TXRECODE_KEY = getTxRecordKey([
      store.accountModule.address,
      store.accountModule.network.chainId,
    ])
    const list = StorageUtil.get(TXRECODE_KEY, true) ?? []
    this.transactionList = list
    this.loopTransactionStatus()
  }
  async getTransactionStatus() {
    if (!provider) return

    for (const v of this.transactionList) {
      if (v.status === TransactionStatusEnum.pending) {
        const res = await provider.getTransactionReceipt(v.txHash)
        if (!res) return
        const status =
          res.status === 1
            ? TransactionStatusEnum.success
            : TransactionStatusEnum.failed

        this.updateTransaction({
          ...v,
          status,
        })
      }
    }
  }

  updateTransaction(item: TxRecordItem) {
    const index = this.transactionList.findIndex(v => v.txHash === item.txHash)
    const newList = [
      ...this.transactionList.slice(0, index),
      item,
      ...this.transactionList.slice(index + 1),
    ]
    this.saveTransaction(newList)
  }

  loopTransactionStatus() {
    this.getTransactionStatus()
    clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.getTransactionStatus()
    }, 30 * 1000)
  }

  addTransaction(item: TxRecordItem) {
    console.log('addTransaction', item)

    const TXRECODE_KEY = getTxRecordKey([
      store.accountModule.address,
      store.accountModule.network.chainId,
    ])
    const list = StorageUtil.get(TXRECODE_KEY, true) ?? []
    const newList = [item, ...list]
    if (newList.length > this.maxLength) {
      newList.length === this.maxLength
    }
    this.saveTransaction(newList)
  }

  saveTransaction(list: TxRecordItem[]) {
    const TXRECODE_KEY = getTxRecordKey([
      store.accountModule.address,
      store.accountModule.network.chainId,
    ])
    StorageUtil.set(TXRECODE_KEY, JSON.stringify(list), true)
    this.transactionList = list
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

export const getTxRecordKey = ([addr, cId]) => `x-tx-${cId}-${addr}`
export default TransactionModule
