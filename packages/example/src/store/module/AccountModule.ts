import { makeAutoObservable } from 'mobx'

import { requestAccount } from '@/service/metamask'
import { NetworkItem } from '@/service/models'
import { ethers, provider } from '@/utils'

const { ethereum } = window
import type { AccountItem } from '@safeheron/mpcsnap-types'

import { store } from '@/store'

class AccountModule {
  walletName = ''
  address = ''
  balance = ''
  network: NetworkItem = {} as NetworkItem
  backuped?: boolean

  timer: any

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
    store.interactive.setLoading(true)
    const res = await requestAccount()

    store.interactive.setLoading(false)
    if (res.success) {
      this.setAccount(res.data)
    }
  }

  setBackupStatus(backuped) {
    this.backuped = backuped
  }

  loopBalance(address: string) {
    this.getBalance(address)
    clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.getBalance(address)
    }, 30 * 1000)
  }

  async getBalance(address: string) {
    if (!provider) return
    if (!address) return
    try {
      const res = await provider.getBalance(address)
      console.log('getBalance', res.toString())
      this.balance = res.toString()
    } catch (error) {
      console.error(error)
    }
  }

  async getNetwork() {
    if (!ethereum) return
    ethereum.on('chainChanged', _chainId => {
      window.location.reload()
    })
    store.interactive.setLoading(true)
    // @ts-ignore
    const chainId: string = await ethereum.request({ method: 'eth_chainId' })

    try {
      const chainList = await ethers.utils.fetchJson(
        'https://chainid.network/chains.json'
      )
      store.interactive.setLoading(false)

      const chainInfo = chainList.find(v => v.chainId === parseInt(chainId))

      this.network = {
        name: chainInfo.title || chainInfo.name,
        chainId,
        explorer: !chainInfo.explorers.length
          ? null
          : chainInfo.explorers[0]?.url,
      }
    } catch (error) {
      store.interactive.setLoading(false)
      console.log(error)
    }
  }
}

export default AccountModule
