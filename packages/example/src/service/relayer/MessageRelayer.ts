import { EventEmitter } from 'events'

import { MessageChannel } from '../channel/MessageChannel'
import { MPCMessage, MPCMessageType } from '../types'

class MessageRelayer extends EventEmitter {
  channelList: MessageChannel[] = []

  messagePool: Map<MPCMessageType, MPCMessage[]> = new Map<
    MPCMessageType,
    MPCMessage[]
  >()

  private parts?: string[] = []

  get channelIsReady() {
    return this.total === this.channelList.length
  }

  constructor(private total: number) {
    super()
    console.log('relayer created!')
  }

  private collectMessage(message: MPCMessage) {
    const messageType = message.messageType
    const sendType = message.sendType || 'all'
    if (!messageType || sendType !== 'all') return

    if (!message.to) {
      this.parts = undefined
    } else {
      this.parts = [message.from, message.to]
    }
    if (this.messagePool.has(messageType)) {
      this.messagePool.get(messageType)!.push(message)
    } else {
      this.messagePool.set(messageType, [message])
    }
  }

  join(channel: MessageChannel) {
    this.channelList.push(channel)

    console.log(`${channel.name} join`)

    channel.on('receive', (message: MPCMessage) => {
      console.log(
        '[MessageRelayer](receive) <<',
        `from: ${message.from}, sendType: ${
          message.sendType || 'all'
        }, message type: ${message.messageType}`
      )

      switch (message.sendType) {
        case 'broadcast':
          this.sendBroadcast(message)
          break

        case 'p2p':
          this.sendTo(message)
          break

        case 'all':
        default:
          this.collectMessage(message)
          this.forwardMessage()
          break
      }
    })
  }

  // p2p
  private sendTo(message: MPCMessage) {
    console.debug(
      `[MessageRelayer](p2p message) start... message type>> ${message.messageType}, to>> ${message.to}`
    )
    this.channelList.forEach(channel => {
      if (channel.name === message.to) {
        channel.receiveInternal(JSON.stringify([message]))
      }
    })
  }

  // broadcast
  private sendBroadcast(message: MPCMessage) {
    console.debug(
      `[MessageRelayer](broadcast message) start... message type>> ${message.messageType}`
    )
    this.channelList.forEach(channel => {
      if (channel.name !== message.from) {
        channel.receiveInternal(JSON.stringify([message]))
      }
    })
  }

  private forwardMessage() {
    if (!this.channelIsReady) {
      return
    }
    console.debug(
      `[MessageRelayer](forward message) start... message type>> ${this.messagePool[0]?.messageType}`
    )

    this.messagePool.forEach((messageArray, type) => {
      if (!this.parts?.length) {
        if (messageArray.length === this.total) {
          // delete sended messages
          this.messagePool.delete(type)

          // send message
          this.channelList.forEach(channel => {
            const combineMessage = messageArray.filter(
              m => m.from !== channel.name
            )
            channel.receiveInternal(JSON.stringify(combineMessage))
          })
        }
      } else {
        if (messageArray.length === this.parts.length) {
          // delete sended messages
          this.messagePool.delete(type)

          // send message
          this.channelList.forEach(channel => {
            if (this.parts?.includes(channel.name)) {
              const combineMessage = messageArray.filter(
                m => m.from !== channel.name
              )
              channel.receiveInternal(JSON.stringify(combineMessage))
            }
          })
        }
      }
    })
  }

  dispose() {
    this.channelList = []
    this.messagePool.clear()
  }
}

export default MessageRelayer
