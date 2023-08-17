import { Button, Modal } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import waiting from '@/assets/waiting.png'
import MPCState from '@/components/MPCState'
import StepContainer from '@/components/StepContainer'
import StepText from '@/components/StepText'
import WebRTCConnection from '@/components/WebRTCConnection'
import useConfirm, { CANCEL_CONFIRM_TEXT } from '@/hooks/useConfirm'
import { RPCChannel } from '@/service/channel/RPCChannel'
import { WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { PartyId } from '@/service/types'
import { MPCMessageType } from '@/service/types'
import { store, useStore } from '@/store'
import styles from '@/styles/containers/CreateDialog.module.less'

const steps = [
  {
    title: 'Step1: Connect to one of phones with Safeheron Snap App',
    desc: `Participate in creating an MPC wallet via Safeheron Snap App and then follow the steps on the right side.`,
    successText: 'Connected',
  },
  {
    title: 'Step2: Confirm the transaction in the connected Safeheron Snap App',
    successText: 'Confirmed',
  },
  {
    title:
      'Step3: Keep the Safeheron Snap App open and do not switch to other pages. Wait for the transaction success',
    successText: 'Success',
    loadingText:
      'Waiting for the three parties to compute and then sign the transaction.',
  },
]
const SignTransactionDialog = () => {
  const { interactive, messageModule, accountModule, transactionModule } =
    useStore()
  const step = interactive.signStep
  const [webrtcChannel, setWebrtcChannel] = useState<WebRTCChannel>()

  useEffect(() => {
    const rpcChannel = new RPCChannel()
    messageModule.setRPCChannel(rpcChannel)
    messageModule.messageRelayer?.join(rpcChannel)

    setupRtcChannel()

    return () => {
      interactive.setCreateStep(1)
    }
  }, [])

  const isSuccess = step > 3

  const setupRtcChannel = async () => {
    const rtcChannel = new WebRTCChannel('signChannel')
    setWebrtcChannel(rtcChannel)
    rtcChannel.on('channelOpen', async () => {
      setTimeout(async () => {
        await rtcChannel.sendMessage(
          JSON.stringify({
            messageType: MPCMessageType.signPrepare,
            messageContent: {
              ...transactionModule.transactionObject,
              chainName: store.accountModule.network.name,
            },
          })
        )

        messageModule.rpcChannel?.next({
          messageType: MPCMessageType.signReady,
          messageContent: [PartyId.A, rtcChannel.getPartyId()],
        })

        interactive.setSignStep(2)
      }, 1000)
    })

    messageModule.messageRelayer?.join(rtcChannel)
  }

  const handleTxnHash = async () => {
    window.open(`${accountModule.network.explorer}/tx/${interactive.txHash}`)
  }

  const { showConfirm } = useConfirm()
  const handleCancel = () => {
    showConfirm({
      content: CANCEL_CONFIRM_TEXT,
      onOk: () => {
        interactive.setSignTransactionDialogVisible(false)
        messageModule.rpcChannel?.next({
          messageType: MPCMessageType.abort,
          sendType: 'broadcast',
          messageContent: 'signTransaction',
        })
      },
    })
  }

  const handleClose = () => {
    interactive.setSignTransactionDialogVisible(false)
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
                  onClick={handleTxnHash}
                  style={{ marginRight: 30 }}>
                  Txn Hash
                </Button>
                <Button onClick={handleClose}>Close</Button>
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
              {step === 1 ? (
                <WebRTCConnection webrtcChannel={webrtcChannel} />
              ) : step === 2 ? (
                <div>
                  <img src={waiting} width="168" />
                </div>
              ) : step === 3 ? (
                <MPCState
                  loading
                  number={interactive.progress}
                  text="MPC Signing…"
                />
              ) : (
                <MPCState />
              )}
            </>
          }
        />
      </div>
    </Modal>
  )
}

export default observer(SignTransactionDialog)
