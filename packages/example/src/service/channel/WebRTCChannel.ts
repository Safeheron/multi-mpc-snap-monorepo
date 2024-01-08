import 'webrtc-adapter'

import { Buffer } from 'buffer'

import { MPCMessage } from '@/service/types'
import { getLogger, LogType } from '@/utils/Log'
import metrics from '@/utils/Metrics'

import { MessageChannel } from './MessageChannel'

export type RTCMetaMessage = {
  size: number
}

export type RTCSignaling = {
  sdp: RTCSessionDescriptionInit
  candidates: RTCIceCandidate[]
}

const TRACE_CONNECT = 'trace_webrtc_connect'

export class WebRTCChannel extends MessageChannel {
  private logger = getLogger(LogType.WEBRTC)

  private pc: RTCPeerConnection
  private readonly dc: RTCDataChannel

  private readonly BUFFER_THRESHOLD = 64 * 1024

  private iceCandidateList: RTCIceCandidate[] = []
  private offer: RTCSessionDescriptionInit

  private peerMessage: PeerMessage | null = null

  private _peerConnectionState: RTCPeerConnectionState

  get peerConnectionState() {
    return this._peerConnectionState
  }

  constructor(name: string) {
    super(name)
    metrics.startTransaction(TRACE_CONNECT)

    metrics.startChild(TRACE_CONNECT, 'createPC', name)
    const pc = new RTCPeerConnection({ iceCandidatePoolSize: 10 })
    pc.addEventListener('icecandidate', this.onIceCandidate.bind(this))
    pc.addEventListener(
      'icegatheringstatechange',
      this.onIceGatheringStateChange.bind(this)
    )
    pc.addEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange.bind(this)
    )
    pc.addEventListener(
      'connectionstatechange',
      this.onPeerConnectionStateChanged.bind(this)
    )
    pc.addEventListener(
      'signalingstatechange',
      this.onSignalingStateChanged.bind(this)
    )
    metrics.endChild(TRACE_CONNECT, 'createPC')

    metrics.startChild(TRACE_CONNECT, 'createDataChannel', name)
    const dc = pc.createDataChannel('MPC Data Channel')
    dc.bufferedAmountLowThreshold = this.BUFFER_THRESHOLD
    dc.binaryType = 'arraybuffer'

    dc.addEventListener('open', this.onDataChannelOpened.bind(this))
    dc.addEventListener('message', this.onReceiveMessage.bind(this))
    dc.addEventListener('close', this.onDataChannelClosed.bind(this))
    dc.addEventListener('closing', this.onDataChannelClosing.bind(this))
    dc.addEventListener('error', this.onDataChannelError.bind(this))
    metrics.endChild(TRACE_CONNECT, 'createDataChannel')

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
    metrics.startChild(TRACE_CONNECT, 'createOffer', this.name)
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(new RTCSessionDescription(offer))
    this.offer = offer
    metrics.endChild(TRACE_CONNECT, 'createOffer')
    return offer
  }

  async setAnswerAndICE(
    answer: RTCSessionDescriptionInit,
    iceCandidates: RTCIceCandidate[]
  ) {
    this.logger.info(
      `[webrtc](${this.name}) start to set remote ice candidate, local signalingState is %s, local signaling data is: %s, \n remote ice candidates is: %s`,
      this.pc.signalingState,
      JSON.stringify(this.getICEAndOffer()),
      JSON.stringify(iceCandidates)
    )
    metrics.startChild(TRACE_CONNECT, 'receive signaling', {
      signalingState: this.pc.signalingState,
      answer,
      ices: iceCandidates,
      name: this.name,
    })
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
    iceCandidates.forEach(candidate => {
      this.pc.addIceCandidate(candidate)
    })
    metrics.endChild(TRACE_CONNECT, 'receive signaling')
  }

  private onIceConnectionStateChange() {
    const state = this.pc.iceConnectionState
    this.emit('iceConnectionStateChanged', state)

    metrics.startChild(TRACE_CONNECT, 'ice-state-changed', state)
    this.logger.info(
      `[webrtc](${this.name}) ice connection state changed, new state is: `,
      state
    )
    metrics.endChild(TRACE_CONNECT, 'ice-state-changed')
  }

  private onPeerConnectionStateChanged() {
    const state = this.pc.connectionState

    this._peerConnectionState = state
    this.emit('peerStateChanged', state)

    metrics.startChild(TRACE_CONNECT, 'peer-state-changed', state)
    this.logger.info(
      `[webrtc](${this.name}) peer connection state changed, new state is: ${state}`
    )
    metrics.endChild(TRACE_CONNECT, 'peer-state-changed')

    if (state === 'closed' || state === 'failed') {
      this.emit('peerClosed')
    }

    if (state === 'connected' || state === 'failed' || state === 'closed') {
      metrics.endTransaction(TRACE_CONNECT)
    }
  }

  private onSignalingStateChanged() {
    const state = this.pc.signalingState

    metrics.startChild(TRACE_CONNECT, 'signal-state-changed', state)
    this.logger.info(
      `[webrtc](${this.name}) signaling state changed, new state is: ${state}`
    )
    metrics.endChild(TRACE_CONNECT, 'signal-state-changed')
  }

  private onIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (event.candidate) {
      metrics.startChild(TRACE_CONNECT, 'localIceAdd', event.candidate)
      this.iceCandidateList.push(event.candidate)
      metrics.endChild(TRACE_CONNECT, 'localIceAdd')
    }
  }

  private onIceGatheringStateChange() {
    const iceGatheringState = this.pc.iceGatheringState

    if (iceGatheringState === 'complete') {
      metrics.startChild(TRACE_CONNECT, 'iceReady')
      this.emit('iceReady')
      metrics.endChild(TRACE_CONNECT, 'iceReady')
    }
  }

  private onDataChannelOpened() {
    metrics.startChild(TRACE_CONNECT, 'dataChannelOpen')
    this.logger.info(`[webrtc](${this.name}) data channel opened ✅`)
    metrics.endChild(TRACE_CONNECT, 'dataChannelOpen')
    this.emit('channelOpen')
  }

  private onDataChannelClosing() {
    metrics.startChild(TRACE_CONNECT, 'dataChannelClosing')
    this.logger.info(`[webrtc](${this.name}) data channel closing 💀`)
    metrics.endChild(TRACE_CONNECT, 'dataChannelClosing')
  }

  private onDataChannelClosed() {
    metrics.startChild(TRACE_CONNECT, 'dataChannelClosed')
    this.logger.info(`[webrtc](${this.name}) data channel closed ❌`)
    this.emit('channelClosed')
    metrics.endChild(TRACE_CONNECT, 'dataChannelClosed')
    this.disconnect()
  }

  private onDataChannelError(event: RTCErrorEvent) {
    metrics.startChild(TRACE_CONNECT, 'dataChannelError')
    this.logger.info(`[webrtc](${this.name}) dataChannel error ❌`, event)
    metrics.endChild(TRACE_CONNECT, 'dataChannelError')
  }

  private onReceiveMessage(event: MessageEvent) {
    if (typeof event.data === 'string') {
      this.logger.debug(
        `[webrtc] [data channel](${this.name}) receive string message: `,
        event.data
      )
      const messageMeta = JSON.parse(event.data) as RTCMetaMessage
      this.peerMessage = new PeerMessage(
        messageMeta.size,
        (message: string) => {
          this.logger.debug(
            `[webrtc] [data channel](${this.name}) receive buffer message: `,
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
    if (!this.dc) {
      this.logger.error(
        `[webrtc](${this.name}) dataChannel is undefined, ignore this message`
      )
      return
    }

    if (this.dc.readyState !== 'open') {
      this.logger.error(
        `[webrtc](${this.name}) dataChannel cannot send message, invalid readyState: %s.`,
        this.dc.readyState
      )
      this.disconnect()
      return
    }

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
    /* no op */
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
      this.logger.info(`[WebRtcChannel](${this.name}): send >>`, messageArray)
      await this.sendMessage(JSON.stringify(messageArray))
    } catch (e) {
      this.logger.error(`[WebRtcChannel](${this.name}): send occur an error`, e)
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
