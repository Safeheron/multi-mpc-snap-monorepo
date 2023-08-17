import 'webrtc-adapter'

import { Buffer } from 'buffer'

import { MPCMessage } from '@/service/types'

import { MessageChannel } from './MessageChannel'

export type RTCMetaMessage = {
  size: number
}

export type RTCSignaling = {
  sdp: RTCSessionDescriptionInit
  candidates: RTCIceCandidate[]
}

export class WebRTCChannel extends MessageChannel {
  private pc: RTCPeerConnection
  private readonly dc: RTCDataChannel

  private readonly BUFFER_THRESHOLD = 64 * 1024

  private iceCandidateList: RTCIceCandidate[] = []
  private offer: RTCSessionDescriptionInit

  private peerMessage: PeerMessage | null = null

  constructor(name: string) {
    super(name)
    const pc = new RTCPeerConnection()
    pc.addEventListener('icecandidate', this.onIceCandidate.bind(this))
    pc.addEventListener(
      'icegatheringstatechange',
      this.onIceGatheringStateChange.bind(this)
    )
    pc.addEventListener(
      'connectionstatechange',
      this.onPeerConnectionStateChanged.bind(this)
    )

    const dc = pc.createDataChannel('MPC Data Channel')
    dc.bufferedAmountLowThreshold = this.BUFFER_THRESHOLD
    dc.binaryType = 'arraybuffer'

    dc.addEventListener('open', this.onDataChannelOpened.bind(this))
    dc.addEventListener('close', this.onDataChannelClosed.bind(this))
    dc.addEventListener('message', this.onReceiveMessage.bind(this))

    this.pc = pc
    this.dc = dc
  }

  getICEAndOffer(): RTCSignaling {
    return {
      sdp: this.offer,
      candidates: this.iceCandidateList,
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(new RTCSessionDescription(offer))
    this.offer = offer
    return offer
  }

  async setAnswerAndICE(
    answer: RTCSessionDescriptionInit,
    iceCandidates: RTCIceCandidate[]
  ) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
    iceCandidates.forEach(candidate => {
      this.pc.addIceCandidate(candidate)
    })
  }

  private onPeerConnectionStateChanged() {
    console.debug(
      `WebRTC peer connection: [${this.name}] state changed, new state is: ${this.pc.connectionState}`
    )
    if (this.pc.connectionState === 'closed') {
      this.emit('peerClosed')
    }
  }

  private onIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (event.candidate) {
      this.iceCandidateList.push(event.candidate)
    }
  }

  private onIceGatheringStateChange() {
    const iceGatheringState = this.pc.iceGatheringState
    if (iceGatheringState === 'complete') {
      this.emit('iceReady')
    }
  }

  private onDataChannelOpened() {
    console.debug(`WebRTC dataChannel:[${this.name}] opened...`)
    this.emit('channelOpen')
  }

  private onDataChannelClosed() {
    console.debug(`WebRTC dataChannel:[${this.name}] closed...`)
    this.emit('channelClosed')
    this.disconnect()
  }

  private onReceiveMessage(event: MessageEvent) {
    if (typeof event.data === 'string') {
      console.log(
        `[data channel](${this.name}) receive string message from phone: `,
        event.data
      )
      const messageMeta = JSON.parse(event.data) as RTCMetaMessage
      this.peerMessage = new PeerMessage(
        messageMeta.size,
        (message: string) => {
          console.debug(
            `[data channel](${this.name}) receive buffer message from phone: `,
            message
          )
          this.receiveExternal(message)
        }
      )
    } else if (event.data instanceof ArrayBuffer) {
      if (this.peerMessage) {
        this.peerMessage.addChunk(event.data)
      } else {
        throw new Error(
          'Unexpected message data, please check that if you send message meta first.'
        )
      }
    } else {
      throw new Error('Unexpected data type, must be either string or Buffer.')
    }
  }

  async sendMessage(message: string) {
    const buffer = Buffer.from(message, 'utf-8')

    // Send Message meta first
    const messageSize = buffer.length
    const metaMessage: RTCMetaMessage = { size: messageSize }
    this.dc.send(JSON.stringify(metaMessage))

    // Send message chunk buffer
    let offset = 0
    while (offset < messageSize) {
      const chunk = buffer.slice(offset, offset + this.BUFFER_THRESHOLD)
      if (this.dc.bufferedAmount > this.BUFFER_THRESHOLD) {
        await new Promise(resolve => {
          this.dc.addEventListener('bufferedamountlow', () => {
            resolve(0)
          })
        })
      }
      this.dc.send(chunk)
      offset += chunk.length
    }
  }

  connect(callback): void {
    // TODO xxx
  }

  disconnect(): void {
    if (
      this.dc &&
      this.dc.readyState !== 'closed' &&
      this.dc.readyState !== 'closing'
    ) {
      this.dc.close()
    }
    this.pc.close()
  }

  protected async sendExternal(messageArray: MPCMessage[]) {
    try {
      console.log(`[WebRtcChannel](${this.name}): send >>`, messageArray)
      await this.sendMessage(JSON.stringify(messageArray))
    } catch (e) {
      console.error(`[WebRtcChannel](${this.name}): send occur an error`, e)
      throw e
    }
  }
}

type MessageCompleteCallback = (message: string) => void

class PeerMessage {
  private readonly size: number
  private receivedChunk = Buffer.alloc(0)

  private readonly onMessageComplete: MessageCompleteCallback

  constructor(size: number, onComplete: MessageCompleteCallback) {
    this.size = size
    this.onMessageComplete = onComplete
  }

  addChunk(buffer: ArrayBuffer) {
    this.receivedChunk = Buffer.concat([
      this.receivedChunk,
      Buffer.from(buffer),
    ])
    if (this.receivedChunk.length === this.size) {
      this.onMessageComplete(this.receivedChunk.toString('utf-8'))
    }
  }
}
