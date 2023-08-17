import { makeAutoObservable } from 'mobx'

import { CACHE_ID_CHAIN } from '@/configs/Configs'

interface Chain {
  title: string
  name: string
  chain: string
  chainId: number
  explorers: {
    url: string
    name: string
  }[]
  nativeCurrency: {
    symbol: string
    decimals: number
  }
}

class NetworkModule {
  hexChainId = ''

  loadingChainList = false
  chainList: Chain[] = []
  fetchChainListFailed = false

  get intChainId(): string {
    return this.hexChainId ? '' + parseInt(this.hexChainId, 16) : '--'
  }

  get currentChain(): Chain | undefined {
    return this.chainList.find(c => c.chainId === parseInt(this.hexChainId))
  }

  get chainName(): string | undefined {
    return this.currentChain?.title || this.currentChain?.name
  }

  get explorer(): Chain['explorers'][number] | undefined {
    return this.currentChain?.explorers?.[0]
  }

  constructor() {
    makeAutoObservable(this)

    this.setChainId()
    this.listenChainChanged()
    this.loadNetwork()
  }

  private async setChainId() {
    const chainId = await window.ethereum?.request({ method: 'eth_chainId' })
    this.hexChainId = (chainId ?? '') as string
  }

  private listenChainChanged() {
    window.ethereum?.on('chainChanged', this.handleChainChanged.bind(this))
  }

  private handleChainChanged() {
    // TODO don't reload page
    window.location.reload()
  }

  getChain(chainId: string | number | undefined): Chain | undefined {
    if (!chainId) return undefined
    chainId = String(chainId)
    const chain = this.chainList.find(
      c => c.chainId === parseInt(chainId as string)
    )
    return chain
  }

  getExplorer(chainId: string | number | undefined): string | undefined {
    const chain = this.getChain(chainId)
    const explorer = chain?.explorers?.[0]
    return explorer?.url
  }

  getChainName(chainId: string | number | undefined): string {
    const chain = this.getChain(chainId)
    return chain?.title || chain?.name || ''
  }

  async loadNetwork() {
    this.loadingChainList = true
    const cachedChainList = localStorage.getItem(CACHE_ID_CHAIN)
    if (cachedChainList) {
      this.chainList = JSON.parse(cachedChainList)
    } else {
      await this.fetchChainList()
    }
    this.loadingChainList = true
  }

  private async fetchChainList() {
    this.fetchChainListFailed = false
    fetch('https://chainid.network/chains.json')
      .then(response => response.json())
      .then(data => {
        const flatChainList = data.map(d => {
          return {
            title: d.title,
            name: d.name,
            chain: d.chain,
            chainId: d.chainId,
            explorers: d.explorers,
            nativeCurrency: d.nativeCurrency,
          } as Chain
        })
        this.chainList = flatChainList
        localStorage.setItem(CACHE_ID_CHAIN, JSON.stringify(flatChainList))
      })
      .catch(error => {
        this.fetchChainListFailed = true
      })
  }
}

export default NetworkModule
