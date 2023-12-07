import { URDecoder } from '@ngraveio/bc-ur'
import { BrowserQRCodeReader } from '@zxing/browser'
import { IScannerControls } from '@zxing/browser/esm/common/IScannerControls'
import { message } from 'antd'
import pako from 'pako'
import React, {
  FC,
  ForwardRefExoticComponent,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'

import { useMediaDeviceDetect } from '@/hooks/useMediaDeviceDetect'

const codeReader = new BrowserQRCodeReader()

interface Props {
  onComplete: (msg: any) => void
  onProgress?: (number: number) => void
}

interface Handle {
  resume: () => void
}

const Container = styled.div`
  .video-container {
    background: black;
    border: 1px solid rgba(0, 0, 0, 0.12);
    overflow: hidden;
    width: 200px;
    height: 200px;
  }
  .tip {
    text-align: center;
    margin-top: 7px;
  }
`

const ScanDynamicQrCode: React.ForwardRefRenderFunction<Handle, Props> = (
  { onComplete, onProgress },
  ref
) => {
  const { detected, support, errMessage } = useMediaDeviceDetect()

  const [inputDeviceId, setInputDeviceId] = useState('')
  const [progress, setProgress] = useState<number>(0)
  const previewEle = useRef<HTMLVideoElement>(null)
  const cameraControls = useRef<IScannerControls>()

  useImperativeHandle(ref, () => ({
    resume: () => {
      setProgress(0)
      setup()
    },
  }))

  const setup = async () => {
    if (!detected) return
    if (!support) {
      message.error(errMessage)
      return
    }
    const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices()
    if (videoInputDevices && videoInputDevices.length > 0) {
      setInputDeviceId(videoInputDevices[0].deviceId)
    } else {
      message.error('can not access camera.')
      return
    }
    scanQrCode()
  }

  const scanQrCode = async () => {
    if (!previewEle.current) {
      return
    }
    const decoder = new URDecoder()
    cameraControls.current = await codeReader.decodeFromVideoDevice(
      inputDeviceId,
      previewEle.current,
      (result, error) => {
        const percent = decoder.getProgress()
        if (percent > progress) {
          setProgress(percent)
          onProgress && onProgress(percent)
        }

        if (!decoder.isComplete()) {
          if (result?.getText()) {
            decoder.receivePart(result?.getText() as string)
          }
          return
        }

        if (decoder.isSuccess()) {
          const ur = decoder.resultUR()
          const decoded = ur.decodeCBOR()

          const inflateStr = pako.inflate(decoded, {
            to: 'string',
          })
          onComplete(inflateStr)

          resetCamera()
        } else {
          const decodedErrors = decoder.resultError()
          console.log('decode error====', decodedErrors)
          resetCamera()
        }
      }
    )
  }

  const resetCamera = () => {
    cameraControls.current?.stop()
  }

  useEffect(() => {
    setup()
    return () => {
      resetCamera()
    }
  }, [detected])

  return (
    <Container>
      <div className={'video-container'}>
        <video
          ref={previewEle}
          id="videoRef"
          width="200"
          height="200"
          style={{ transform: 'rotateY(180deg)', filter: 'blur(4px)' }}
          // style={{ filter: 'blur(12px)' }}
        />
      </div>
      {progress > 0 && progress < 1 && (
        <div className={'tip'}>Progress: {(progress * 100).toFixed(0)}%</div>
      )}
    </Container>
  )
}

export default React.forwardRef(ScanDynamicQrCode)
