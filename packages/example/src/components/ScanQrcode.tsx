import { BrowserQRCodeReader } from '@zxing/browser'
import { IScannerControls } from '@zxing/browser/esm/common/IScannerControls'
import { message } from 'antd'
import { FC, useEffect, useRef, useState } from 'react'

import styles from '@/styles/components/ScanQrcode.module.less'
const codeReader = new BrowserQRCodeReader()

interface Props {
  step: number
  desc?: string
  onComplete: (msg: any) => void
}

const ScanQrcode: FC<Props> = ({ step, desc, onComplete }) => {
  const [inputDeviceId, setInputDeviceId] = useState('')
  const [progress, setProgress] = useState<number>(0)
  const previewEle = useRef<HTMLVideoElement>(null)
  const cameraControls = useRef<IScannerControls>()
  const timer = useRef<any>()

  useEffect(() => {
    init()

    return () => {
      clearInterval(timer.current)
      resetCamera()
    }
  }, [step])

  useEffect(() => {
    setProgress(0)
  }, [step])

  const init = async () => {
    try {
      const videoInputDevices =
        await BrowserQRCodeReader.listVideoInputDevices()
      if (!videoInputDevices?.length) {
        message.error('Can not find camera')
      } else {
        setInputDeviceId(videoInputDevices[0].deviceId)
        scanQrCode()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const scanQrCode = async () => {
    if (!previewEle.current) {
      return
    }

    cameraControls.current = await codeReader.decodeFromVideoDevice(
      inputDeviceId,
      previewEle.current,
      (result, error) => {
        if (result?.getText()) {
          console.log(result?.getText())
          onComplete(result?.getText())
          resetCamera()
        }
      }
    )
  }

  const resetCamera = () => {
    cameraControls.current?.stop()
  }

  return (
    <div className={styles.scanQrcode}>
      <div
        style={{
          background: 'black',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          width: 190,
          height: 190,
        }}>
        <video
          ref={previewEle}
          id="videoRef"
          width="190"
          height="190"
          // style={{
          //   filter: 'blur(12px)',
          // }}
        />
      </div>
    </div>
  )
}

export default ScanQrcode
