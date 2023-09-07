import { Button, Modal } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import MPCState from '@/components/MPCState'
import StepContainer from '@/components/StepContainer'
import StepText from '@/components/StepText'
import WebRTCConnection from '@/components/WebRTCConnection'
import useConfirm, { CANCEL_CONFIRM_TEXT } from '@/hooks/useConfirm'
import useSnapKeepAlive from '@/hooks/useSnapKeepAlive'
import { WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { backupApproval } from '@/service/metamask'
import { PartyId } from '@/service/types'
import { MPCMessageType } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/CreateDialog.module.less'

const steps = [
  {
    title: 'Step 1: Connect to Safeheron Snap App on your first phone',
    desc: `Participate in creating an MPC wallet through Safeheron Snap App, and then follow the steps on the right side.`,
    successText: 'Connected',
  },
  {
    title: 'Step 2: Connect to Safeheron Snap App on your second phone',
    desc: `Participate in creating an MPC wallet through Safeheron Snap App, and then follow the steps on the right side.`,
    successText: 'Connected',
  },
  {
    title:
      'Step 3: Keep this window open for creating your wallet successfully',
    successText: 'The MPC wallet is created successfully',
    loadingText:
      'Waiting for the three parties to compute and create the MPC Wallet.',
  },
]
const CreateDialog = () => {
  useSnapKeepAlive()

  const { interactive, messageModule, accountModule } = useStore()
  const step = interactive.createStep

  const [webrtcChannel1, setWebrtcChannel1] = useState<WebRTCChannel>()
  const [webrtcChannel2, setWebrtcChannel2] = useState<WebRTCChannel>()

  useEffect(() => {
    // TODO close webrtc connection
    return () => {
      interactive.setCreateStep(1)
    }
  }, [webrtcChannel1])

  const isSuccess = step > 3

  useEffect(() => {
    setupWebRTCChannel()
  }, [step])

  const setupWebRTCChannel = () => {
    if (step === 1) {
      const rtcChannel1 = new WebRTCChannel('channel1')
      setWebrtcChannel1(rtcChannel1)
      rtcChannel1.once('channelOpen', () => {
        setTimeout(async () => {
          await rtcChannel1.sendMessage(
            JSON.stringify({
              messageType: MPCMessageType.partyPrepare,
              messageContent: {
                walletName: interactive.walletName,
                partyId: PartyId.B,
              },
            })
          )
          interactive.setCreateStep(step + 1)
        }, 1000)
      })
      messageModule.messageRelayer?.join(rtcChannel1)
    } else if (step === 2) {
      const rtcChannel2 = new WebRTCChannel('channel2')
      setWebrtcChannel2(rtcChannel2)
      rtcChannel2.once('channelOpen', () => {
        setTimeout(async () => {
          await rtcChannel2.sendMessage(
            JSON.stringify({
              messageType: MPCMessageType.partyPrepare,
              messageContent: {
                walletName: interactive.walletName,
                partyId: PartyId.C,
              },
            })
          )
          interactive.setCreateStep(step + 1)
        }, 1000)
      })
      messageModule.messageRelayer?.join(rtcChannel2)
    }
  }

  const handleBackupLater = async () => {
    await accountModule.requestAccount()
    interactive.setCreateDialogVisible(false)
  }

  const { showConfirm } = useConfirm()
  const handleCancel = () => {
    showConfirm({
      content: CANCEL_CONFIRM_TEXT,
      onOk: () => {
        interactive.setCreateDialogVisible(false)
        messageModule.rpcChannel?.next({
          messageType: MPCMessageType.abort,
          messageContent: 'create',
          sendType: 'broadcast',
        })
      },
    })
  }

  const handleBackup = async () => {
    await accountModule.requestAccount()
    const res = await backupApproval(accountModule.walletName)
    if (res.success) {
      interactive.setCreateDialogVisible(false)
      interactive.setSessionId(res.data.sessionId)
      interactive.setMnemonic(res.data.mnemonic)
      interactive.setBackupDialogVisible(true)
    }
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={960}>
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
                <WebRTCConnection webrtcChannel={webrtcChannel1} />
              )}

              {step === 2 && (
                <WebRTCConnection webrtcChannel={webrtcChannel2} />
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
