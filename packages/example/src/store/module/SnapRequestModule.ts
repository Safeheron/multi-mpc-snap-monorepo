import { makeAutoObservable } from 'mobx'

import { listKeyringRequests } from '@/service/metamask'

export default class SnapRequestModule {
  requests: any[]
  isLoop = false

  private loopFlag = false
  private intervalId

  constructor() {
    makeAutoObservable(this)
  }

  async startLoopRequest() {
    if (this.loopFlag) return
    await this.getSnapRequests()
    this.loopFlag = true
    this.intervalId = setInterval(async () => {
      await this.getSnapRequests()
    }, 5_000)
  }

  async getSnapRequests() {
    this.isLoop = true
    const requests = await listKeyringRequests()
    if (requests) {
      this.requests = requests
    }
    this.isLoop = false
  }
}
