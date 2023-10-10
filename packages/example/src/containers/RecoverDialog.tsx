import { OperationType, RecoverPrepareMessage } from '@safeheron/mpcsnap-types'
import { Button, Modal } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import MPCState from '@/components/MPCState'
import StepContainer from '@/components/StepContainer'
import StepText from '@/components/StepText'
import WebRTCConnection from '@/components/WebRTCConnection'
import MnemonicForm from '@/containers/MnemonicForm'
import useConfirm from '@/hooks/useConfirm'
import useSnapKeepAlive from '@/hooks/useSnapKeepAlive'
import { WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { backupApproval } from '@/service/metamask'
import { MPCMessageType } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/RecoverDialog.module.less'

const steps = [
  {
    title: 'Step 1: Connect to Safeheron Snap App on your first phone',
    desc: `Participate in recovering an MPC wallet via Safeheron Snap App and then place the QR code generated in front of the desktop's camera.`,
    successText: 'Connected',
  },
  {
    title: 'Step 2: Connect to Safeheron Snap App on your second phone',
    desc: `Participate in recovering an MPC wallet via Safeheron Snap App and then place the QR code generated in front of the desktop's camera.`,
    successText: 'Connected',
  },
  {
    title:
      'Step 3: Enter the recovery phrase for each private key shard separately as prompted and submit them for confirmation',
    successText: 'Filled',
  },
  {
    title: 'Step 4: Wait for recovery to complete successfully',
    successText: 'The MPC wallet is recovered successfully',
    loadingText:
      'Waiting for the three parties to compute and recover the MPC Wallet.',
  },
]
const RecoverDialog = () => {
  useSnapKeepAlive()

  const {
    interactive,
    messageModule,
    accountModule,
    recoveryModule,
    backupModule,
  } = useStore()

  const { recoverStep: step } = recoveryModule
  const { backuped } = accountModule

  const [webrtcChannel1, setWebrtcChannel1] = useState<WebRTCChannel>()
  const [webrtcChannel2, setWebrtcChannel2] = useState<WebRTCChannel>()

  useEffect(() => {
    return () => {
      recoveryModule.setRecoverStep(0)
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
              sessionId: interactive.sessionId,
            },
          }

          await channel1.sendMessage(JSON.stringify([recoverPrepareMessage]))
          messageModule.messageRelayer?.join(channel1)
          recoveryModule.setRecoverStep(step + 1)
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
              sessionId: interactive.sessionId,
            },
          }
          await channel2.sendMessage(JSON.stringify([recoverPrepareMessage]))
          messageModule.messageRelayer?.join(channel2)
          recoveryModule.setRecoverStep(step + 1)
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
        messageModule.rpcChannel?.next({
          messageType: MPCMessageType.abort,
          sendType: 'broadcast',
          messageContent: 'recover',
        })
      },
    })
  }

  const handleBack = () => {
    recoveryModule.setRecoverDialogVisible(false)
  }

  const handleBackupLater = () => {
    recoveryModule.setRecoverDialogVisible(false)
  }

  const handleBackupWallet = async () => {
    await accountModule.requestAccount()
    const res = await backupApproval(accountModule.walletName)
    if (res.success) {
      recoveryModule.setRecoverDialogVisible(false)
      interactive.setSessionId(res.data.sessionId)
      backupModule.setMnemonic(res.data.mnemonic)
      backupModule.setBackupDialogVisible(true)
    }
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={960}>
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
                  Back to the MPC Wallet
                </Button>
              )
            ) : step === 3 && recoveryModule.mnemonicFormType === 'noNeed' ? (
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
                <WebRTCConnection
                  webrtcChannel={webrtcChannel1}
                  businessType={'recovery'}
                />
              )}
              {step === 2 && (
                <WebRTCConnection
                  webrtcChannel={webrtcChannel2}
                  businessType={'recovery'}
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
