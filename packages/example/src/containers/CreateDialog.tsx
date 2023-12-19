import {
  AbortMessage,
  OperationType,
  PartyPrepareMessage,
} from '@safeheron/mpcsnap-types'
import { Button, message as AntMessage, Modal } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import MPCState from '@/components/MPCState'
import StepContainer from '@/components/StepContainer'
import StepText from '@/components/StepText'
import WebRTCConnection from '@/components/WebRTCConnection'
import useConfirm, { CANCEL_CONFIRM_TEXT } from '@/hooks/useConfirm'
import useSnapKeepAlive from '@/hooks/useSnapKeepAlive'
import useWebRTCFailedStateDetect from '@/hooks/useWebRTCFailedStateDetect'
import { WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { PartyId } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/CreateDialog.module.less'

const steps = [
  {
    title: 'Step 1: Connect to Safeheron Snap App on your first phone',
    desc: `Participate in creating an MPC wallet using the Safeheron Snap App by following the steps on the right.`,
    successText: 'Connected',
  },
  {
    title: 'Step 2: Connect to Safeheron Snap App on your second phone',
    desc: `Participate in creating an MPC wallet using the Safeheron Snap App by following the steps on the right.`,
    successText: 'Connected',
  },
  {
    title:
      'Step 3: Keep this window open for creating your wallet successfully',
    successText: 'The MPC wallet is created successfully',
    loadingText:
      'Waiting for the three devices to compute and create the MPC wallet.',
  },
]
const CreateDialog = () => {
  useSnapKeepAlive()

  const { interactive, accountModule, backupModule, keygenModule } = useStore()
  const step = keygenModule.createStep

  const [webrtcChannel1, setWebrtcChannel1] = useState<WebRTCChannel>()
  const [webrtcChannel2, setWebrtcChannel2] = useState<WebRTCChannel>()

  const onPeerClosed = () => {
    AntMessage.error(
      `WebRTC Peer Connection failed or closed, close the process.`,
      5
    )
    keygenModule.setCreateDialogVisible(false)
    keygenModule.setCreateStep(1)
  }

  const detectRtcChannel1ClosedState = useWebRTCFailedStateDetect(
    onPeerClosed,
    webrtcChannel1
  )
  const detectRtcChannel2ClosedState = useWebRTCFailedStateDetect(
    onPeerClosed,
    webrtcChannel2
  )

  const isSuccess = step > 3

  const setupWebRTCChannel = () => {
    if (step === 1) {
      const rtcChannel1 = new WebRTCChannel('channel1')
      setWebrtcChannel1(rtcChannel1)
      rtcChannel1.once('channelOpen', () => {
        setTimeout(async () => {
          const partyPrepareMessage: PartyPrepareMessage = {
            messageType: OperationType.partyPrepare,
            messageContent: {
              walletName: keygenModule.walletName,
              partyId: PartyId.B,
              sessionId: keygenModule.sessionId,
            },
          }
          await rtcChannel1.sendMessage(JSON.stringify(partyPrepareMessage))
          keygenModule.messageRelayer?.join(rtcChannel1)
          keygenModule.setCreateStep(step + 1)

          detectRtcChannel1ClosedState()
        }, 1000)
      })
    } else if (step === 2) {
      const rtcChannel2 = new WebRTCChannel('channel2')
      setWebrtcChannel2(rtcChannel2)
      rtcChannel2.once('channelOpen', () => {
        setTimeout(async () => {
          const partyPrepareMessage: PartyPrepareMessage = {
            messageType: OperationType.partyPrepare,
            messageContent: {
              walletName: keygenModule.walletName,
              partyId: PartyId.C,
              sessionId: keygenModule.sessionId,
            },
          }

          await rtcChannel2.sendMessage(JSON.stringify(partyPrepareMessage))
          keygenModule.messageRelayer?.join(rtcChannel2)
          keygenModule.setCreateStep(step + 1)

          detectRtcChannel2ClosedState()
        }, 1000)
      })
    }
  }

  const handleBackupLater = async () => {
    await accountModule.requestAccount()
    keygenModule.setCreateDialogVisible(false)
  }

  const { showConfirm } = useConfirm()
  const handleCancel = () => {
    showConfirm({
      content: CANCEL_CONFIRM_TEXT,
      onOk: () => {
        keygenModule.setCreateDialogVisible(false)

        const abortMessage: AbortMessage = {
          sendType: 'broadcast',
          messageType: OperationType.abort,
          messageContent: {
            from: PartyId.A,
            businessType: 'keygen',
            abortType: 'userCancel',
            reason: 'User cancel the wallet create',
          },
        }

        keygenModule.rpcChannel?.next(abortMessage)
      },
    })
  }

  const handleBackup = async () => {
    await accountModule.requestAccount()
    interactive.setLoading(true)
    const res = await backupModule.requestBackupApproval(
      accountModule.walletName
    )
    interactive.setLoading(false)
    if (res.success) {
      keygenModule.setCreateDialogVisible(false)
    }
  }

  useEffect(() => {
    setupWebRTCChannel()
  }, [step])

  useEffect(() => {
    return () => {
      keygenModule.setCreateStep(1)

      webrtcChannel1?.disconnect()
      webrtcChannel2?.disconnect()
    }
  }, [])

  return (
    <Modal centered closable={false} open={true} footer={null} width={1060}>
      <div className={styles.createDialog}>
        <StepContainer
          buttonContent={
            isSuccess ? (
              <>
                <Button
                  type="primary"
                  onClick={handleBackup}
                  style={{ marginRight: '20px' }}>
                  Backup Wallet Now
                </Button>
                <Button onClick={handleBackupLater}>Backup Later</Button>
              </>
            ) : (
              <Button onClick={handleCancel}>Cancel</Button>
            )
          }
          leftContent={
            <StepText steps={steps} stepIndex={step} loadingStep={3} />
          }
          rightContent={
            <>
              {step === 1 && (
                <WebRTCConnection
                  webrtcChannel={webrtcChannel1}
                  businessType={'keygen'}
                />
              )}

              {step === 2 && (
                <WebRTCConnection
                  webrtcChannel={webrtcChannel2}
                  businessType={'keygen'}
                />
              )}

              {step === 3 && (
                <MPCState
                  loading
                  number={interactive.progress}
                  text="Creating..."
                />
              )}

              {step > 3 && <MPCState />}
            </>
          }
        />
      </div>
    </Modal>
  )
}

export default observer(CreateDialog)
