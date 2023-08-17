import { MPCMessage } from '../types'
import { MessageChannel } from './MessageChannel'

export class WebsocketMessageChannel extends MessageChannel {
  websocketClient: WebSocket

  isConnected = false

  constructor(name: string, wsUrl: string) {
    super(name)
    this.websocketClient = new WebSocket(wsUrl)
  }

  connect(callback) {
    this.websocketClient.addEventListener('open', event => {
      this.isConnected = true

      callback(this.websocketClient)
    })
    this.websocketClient.addEventListener('close', event => {
      console.log('close')
      this.isConnected = false
    })
    this.websocketClient.addEventListener('error', event => {
      console.log('error')

      this.isConnected = false
    })
    this.websocketClient.addEventListener('message', event => {
      // console.log('Message from server: ', event.data)

      try {
        const data = JSON.parse(event.data) as MPCMessage

        this.receiveExternal(JSON.stringify(data))
      } catch (error) {
        console.error('Json parse error')
      }
    })
  }

  protected disconnect() {
    if (this.websocketClient) {
      this.websocketClient.close()
      this.isConnected = false
    }
  }

  protected async sendExternal(messageArray: MPCMessage[]) {
    // if (
    //   messageArray[0].messageType === MPCMessageType.roleReady &&
    //   this.role === PartyRole.B
    // ) {
    //   this.setRole(messageArray[0].messageContent)
    // }

    console.warn('ws sendExternal', messageArray)
    console.log(
      `ws role:${this.name} sendType:${messageArray[0].sendType || 'all'}}`
    )

    this.websocketClient.send(JSON.stringify(messageArray))
  }
}
