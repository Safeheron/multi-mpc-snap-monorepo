import { EventEmitter } from 'events'

import { PartyId } from '@/service/types'
import { MPCMessage } from '@/service/types'

export abstract class MessageChannel extends EventEmitter {
  name: string

  protected constructor(name: string) {
    super()
    this.name = name
  }

  protected abstract connect(callback): void
  protected abstract disconnect(): void

  setName(name: string) {
    this.name = name
  }

  async receiveInternal(msg: string) {
    try {
      const messageArray = JSON.parse(msg) as MPCMessage[]
      await this.sendExternal(messageArray)
    } catch (error) {}
  }

  /**
   * receive message from website
   * @param msg
   */
  receiveExternal(msg: string) {
    try {
      const message = JSON.parse(msg) as MPCMessage
      this.emit('receive', message)
    } catch (error) {}
  }

  protected abstract sendExternal(messageArray: MPCMessage[]): Promise<void>
}
