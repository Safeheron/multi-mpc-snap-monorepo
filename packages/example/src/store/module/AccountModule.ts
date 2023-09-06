import type { AccountItem } from '@safeheron/mpcsnap-types'
import { ethers } from 'ethers'
import { makeAutoObservable } from 'mobx'

import { requestAccount } from '@/service/metamask'
import { provider } from '@/utils'

const LOOP_GAP = 20_000

class AccountModule {
  walletName = ''
  address = ''

  balance = '' // wei
  backuped?: boolean

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
    this.loopBalance(this.address)
  }

  async requestAccount() {
    this.requestAccountLoading = true
    const res = await requestAccount()
    this.requestAccountLoading = false
    if (res.success) {
      this.setAccount(res.data)
    }
  }

  setBackupStatus(backuped) {
    this.backuped = backuped
  }

  async loopBalance(address: string) {
    if (!this.loopFlag) {
      clearTimeout(this.timer)
      await this.loop(address)
    }
  }

  private async loop(address: string) {
    this.loopFlag = true
    await this.getBalance(address)

    this.timer = setTimeout(() => {
      this.loop(address)
    }, LOOP_GAP)
  }

  async getBalance(address: string) {
    if (!provider) return
    if (!address) return
    try {
      console.debug('Start to loop balance...')
      const res = await provider.getBalance(address)
      console.debug('Loop balance result: ', res.toString())
      this.balance = res.toString()
    } catch (error) {
      console.error(error)
    }
  }
}

export default AccountModule
