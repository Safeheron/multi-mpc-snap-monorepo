import type { AccountItem } from '@safeheron/mpcsnap-types'
import { message } from 'antd'
import { ethers } from 'ethers'
import { makeAutoObservable } from 'mobx'

import { requestAccount } from '@/service/metamask'
import { getProvider } from '@/utils'

const LOOP_GAP = 20_000

class AccountModule {
  walletId = ''
  walletName = ''
  address = ''
  backuped?: boolean
  synced = false

  balance = '' // wei
  balanceLoading = false

  private loopFlag = false

  timer: any

  requestAccountLoading = false

  get balanceEth() {
    if (!this.balance) return ''
    return ethers.utils.formatUnits(ethers.BigNumber.from(this.balance), 18)
  }

  constructor() {
    makeAutoObservable(this)
  }

  setAccount(account: AccountItem) {
    this.address = account.address
    this.walletName = account.walletName
    this.backuped = account.backuped
    this.synced = account.synced
    this.walletId = account.id
    this.loopBalance()
  }

  async requestAccount() {
    this.requestAccountLoading = true
    const res = await requestAccount()
    this.requestAccountLoading = false
    if (res.success) {
      this.setAccount(res.data)
    }
  }

  async loopBalance() {
    if (!this.loopFlag) {
      clearTimeout(this.timer)
      await this.loop()
    }
  }

  private async loop() {
    this.loopFlag = true
    await this.getBalance()

    this.timer = setTimeout(() => {
      this.loop()
    }, LOOP_GAP)
  }

  async getBalance() {
    if (!this.address) return
    try {
      console.debug('Start to loop balance...')
      const res = await getProvider().getBalance(this.address)
      console.debug('Loop balance result: ', res.toString())
      this.balance = res.toString()
    } catch (error) {
      message.error('Get balance failed: ' + error?.message ?? '')
      console.error(error)
    }
  }
}

export default AccountModule
