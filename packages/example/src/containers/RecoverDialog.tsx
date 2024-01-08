import {
  AbortMessage,
  OperationType,
  RecoverPrepareMessage,
} from '@safeheron/mpcsnap-types'
import { Button, message as AntMessage, Modal } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import MPCState from '@/components/MPCState'
import StepContainer from '@/components/StepContainer'
import StepText from '@/components/StepText'
import WebRTCConnection from '@/components/WebRTCConnection'
import MnemonicForm from '@/containers/MnemonicForm'
import useConfirm from '@/hooks/useConfirm'
import useSnapKeepAlive from '@/hooks/useSnapKeepAlive'
import useWebRTCFailedStateDetect from '@/hooks/useWebRTCFailedStateDetect'
import { WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { PartyId } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/RecoverDialog.module.less'

const steps = [
  {
    title: 'Step 1: Connect to Safeheron Snap App on your first phone',
    desc: `Participate in recovering an MPC wallet using the Safeheron Snap App. Place the QR code generated in front of the desktop’s camera.`,
    successText: 'Connected',
  },
  {
    title: 'Step 2: Connect to Safeheron Snap App on your second phone',
    desc: `Participate in recovering an MPC wallet via Safeheron Snap App and then place the QR code generated in front of the desktop's camera.`,
    successText: 'Connected',
  },
  {
    title:
      'Step 3: Enter the mnemonic phrase for each private key shard separately as prompted and submit them for confirmation',
    successText: 'Completed',
  },
  {
    title: 'Step 4: Wait for recovery to complete successfully',
    successText: 'The MPC wallet is recovered successfully',
    loadingText:
      'Waiting for the three devices to compute and recover the MPC wallet.',
  },
]
const RecoverDialog = () => {
  useSnapKeepAlive()

  const { interactive, accountModule, recoveryModule, backupModule } =
    useStore()

  const { recoverStep: step } = recoveryModule
  const { backuped } = accountModule

  const [webrtcChannel1, setWebrtcChannel1] = useState<WebRTCChannel>()
  const [webrtcChannel2, setWebrtcChannel2] = useState<WebRTCChannel>()

  const onPeerClosed = () => {
    AntMessage.error(
      `WebRTC Peer Connection failed or closed, close the process.`,
      5
    )
    recoveryModule.setRecoverDialogVisible(false)
    recoveryModule.setRecoverStep(1)
  }

  const startDetectChannel1ClosedState = useWebRTCFailedStateDetect(
    onPeerClosed,
    webrtcChannel1
  )
  const startDetectChannel2ClosedState = useWebRTCFailedStateDetect(
    onPeerClosed,
    webrtcChannel2
  )

  useEffect(() => {
    return () => {
      recoveryModule.setRecoverStep(1)

      webrtcChannel1?.disconnect()
      webrtcChannel2?.disconnect()
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
          const recoverPrepareMessage: RecoverPrepareMessage = {
            messageType: OperationType.recoverPrepare,
            messageContent: {
              index: 2,
              sessionId: recoveryModule.sessionId,
            },
          }

          await channel1.sendMessage(JSON.stringify([recoverPrepareMessage]))
          recoveryModule.messageRelayer?.join(channel1)
          recoveryModule.setRecoverStep(step + 1)

          startDetectChannel1ClosedState()
        }, 1000)
      })
    } else if (step === 2) {
      const channel2 = new WebRTCChannel('channel2')
      setWebrtcChannel2(channel2)
      channel2.on('channelOpen', () => {
        setTimeout(async () => {
          const recoverPrepareMessage: RecoverPrepareMessage = {
            messageType: OperationType.recoverPrepare,
            messageContent: {
              index: 3,
              sessionId: recoveryModule.sessionId,
            },
          }
          await channel2.sendMessage(JSON.stringify([recoverPrepareMessage]))
          recoveryModule.messageRelayer?.join(channel2)
          recoveryModule.setRecoverStep(step + 1)

          startDetectChannel2ClosedState()
        }, 1000)
      })
    }
  }

  const { showConfirm } = useConfirm()
  const handleCancel = () => {
    showConfirm({
      content:
        'Do you confirm the cancellation? Canceling will terminate this operational process.',
      onOk: () => {
        recoveryModule.setRecoverDialogVisible(false)

        const abortMessage: AbortMessage = {
          sendType: 'broadcast',
          messageType: OperationType.abort,
          messageContent: {
            businessType: 'recover',
            from: PartyId.A,
            abortType: 'userCancel',
            reason: 'User cancel the recovery flow',
          },
        }

        recoveryModule.rpcChannel?.next(abortMessage)
      },
    })
  }

  const handleBack = () => {
    recoveryModule.setRecoverDialogVisible(false)
  }

  const handleBackupLater = () => handleBack()

  const handleBackupWallet = async () => {
    await accountModule.requestAccount()
    const res = await backupModule.requestBackupApproval(
      accountModule.walletName
    )
    if (res.success) {
      recoveryModule.setRecoverDialogVisible(false)
    }
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={1060}>
      <div className={styles.recoverDialog}>
        <StepContainer
          buttonContent={
            isSuccess ? (
              !backuped ? (
                <>
                  <Button
                    type="primary"
                    onClick={handleBackupWallet}
                    style={{ marginRight: '20px' }}>
                    Backup Wallet Now
                  </Button>
                  <Button onClick={handleBackupLater}>Backup Later</Button>
                </>
              ) : (
                <Button type="primary" onClick={handleBack}>
                  Use my MPC Wallet
                </Button>
              )
            ) : step === 3 && recoveryModule.mnemonicFormType === 'noNeed' ? (
              <Button type="primary" onClick={handleBack}>
                Back to my MPC Wallet
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
                <WebRTCConnection
                  webrtcChannel={webrtcChannel1}
                  businessType={'recover'}
                />
              )}
              {step === 2 && (
                <WebRTCConnection
                  webrtcChannel={webrtcChannel2}
                  businessType={'recover'}
                />
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
