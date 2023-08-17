// import { MPCMessage, MPCMessageType, PartyRole } from '../types'
// import { MessageChannel } from './MessageChannel'

// export class QRCodeMessageChannel extends MessageChannel {
//   qrcodeLoading = true

//   constructor() {
//     super(PartyRole.hardware)
//   }

//   protected connect() {
//     return true
//   }

//   protected disconnect() {
//     this.qrcodeLoading = true
//   }

//   // show qrcode
//   async sendExternal(messageArray: MPCMessage[]) {
//     console.log('QRCodeMessageChannel send', messageArray)
//     this.emit('onChangeQrCode', messageArray)
//   }
// }
