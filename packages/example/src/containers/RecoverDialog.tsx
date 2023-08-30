import { Button, Modal } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import MPCState from '@/components/MPCState'
import StepContainer from '@/components/StepContainer'
import StepText from '@/components/StepText'
import WebRTCConnection from '@/components/WebRTCConnection'
import MnemonicForm from '@/containers/MnemonicForm'
import useConfirm, { CANCEL_CONFIRM_TEXT } from '@/hooks/useConfirm'
import useSnapKeepAlive from '@/hooks/useSnapKeepAlive'
import { WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { MPCMessageType } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/RecoverDialog.module.less'

const steps = [
  {
    title: 'Step1: Connect to Safeheron Snap App of your first phone',
    desc: `Participate in recovering an MPC wallet via Safeheron Snap App and then place the QR code generated in front of the desktop's camera.`,
    successText: 'Connected',
  },
  {
    title: 'Step2: Connect to Safeheron Snap App of your second phone',
    desc: `Participate in recovering an MPC wallet via Safeheron Snap App and then place the QR code generated in front of the desktop's camera.`,
    successText: 'Connected',
  },
  {
    title:
      'Step3: Enter the mnemonic phrase for each private key shard separately as prompted and submit them for confirmation',
    successText: 'Filled',
  },
  {
    title: 'Step4: Wait for recovery to complete successfully',
    successText: 'The MPC wallet is recovered successfully',
    loadingText:
      'Waiting for the three parties to compute and recover the MPC Wallet.',
  },
]
const RecoverDialog = () => {
  useSnapKeepAlive()

  const { interactive, messageModule } = useStore()

  const [webrtcChannel1, setWebrtcChannel1] = useState<WebRTCChannel>()
  const [webrtcChannel2, setWebrtcChannel2] = useState<WebRTCChannel>()

  const step = interactive.recoverStep
  useEffect(() => {
    return () => {
      interactive.setRecoverStep(0)
    }
  }, [])

  useEffect(() => {
    setupRtcChannel()
  }, [step])

  const isSuccess = step > 4

  const setupRtcChannel = () => {
    if (step === 1) {
      const channel1 = new WebRTCChannel('channel 1')
      setWebrtcChannel1(channel1)
      channel1.on('channelOpen', () => {
        setTimeout(async () => {
          await channel1.sendMessage(
            JSON.stringify([
              {
                messageType: MPCMessageType.recoverPrepare,
                messageContent: {
                  index: 2,
                },
              },
            ])
          )
          messageModule.messageRelayer?.join(channel1)
          interactive.setRecoverStep(step + 1)
        }, 1000)
      })
    } else if (step === 2) {
      const channel2 = new WebRTCChannel('channel2')
      setWebrtcChannel2(channel2)
      channel2.on('channelOpen', () => {
        setTimeout(async () => {
          await channel2.sendMessage(
            JSON.stringify([
              {
                messageType: MPCMessageType.recoverPrepare,
                messageContent: {
                  index: 3,
                },
              },
            ])
          )
          messageModule.messageRelayer?.join(channel2)
          interactive.setRecoverStep(step + 1)
        }, 1000)
      })
    }
  }

  const handleStartWallet = async () => {
    interactive.setRecoverDialogVisible(false)
  }

  const { showConfirm } = useConfirm()
  const handleCancel = () => {
    showConfirm({
      content:
        'Do you confirm the cancellation? Canceling will terminate this operational process.',
      onOk: () => {
        interactive.setRecoverDialogVisible(false)
        messageModule.rpcChannel?.next({
          messageType: MPCMessageType.abort,
          sendType: 'broadcast',
          messageContent: 'recover',
        })
      },
    })
  }

  const handleBack = () => {
    interactive.setRecoverDialogVisible(false)
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={960}>
      <div className={styles.recoverDialog}>
        <StepContainer
          buttonContent={
            isSuccess ? (
              <Button type="primary" onClick={handleStartWallet}>
                Use the MPC Wallet
              </Button>
            ) : step === 3 && interactive.mnemonicFormType === 'noNeed' ? (
              <Button type="primary" onClick={handleBack}>
                Back to the MPC Wallet
              </Button>
            ) : (
              <Button onClick={handleCancel}>Cancel</Button>
            )
          }
          leftContent={
            <StepText steps={steps} stepIndex={step} loadingStep={4} />
          }
          rightContent={
            <>
              {step === 1 && (
                <WebRTCConnection webrtcChannel={webrtcChannel1} />
              )}
              {step === 2 && (
                <WebRTCConnection webrtcChannel={webrtcChannel2} />
              )}
              {step === 3 && <MnemonicForm />}
              {step === 4 && (
                <MPCState
                  loading
                  number={interactive.progress}
                  text="Recovering..."
                />
              )}
              {step > 4 && <MPCState />}
            </>
          }
        />
      </div>
    </Modal>
  )
}

export default observer(RecoverDialog)
