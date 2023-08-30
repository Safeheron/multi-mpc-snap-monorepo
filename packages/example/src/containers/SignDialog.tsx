import { Button, Modal } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import waiting from '@/assets/waiting.png'
import MPCState from '@/components/MPCState'
import StepContainer from '@/components/StepContainer'
import StepText from '@/components/StepText'
import WebRTCConnection from '@/components/WebRTCConnection'
import useConfirm, { CANCEL_CONFIRM_TEXT } from '@/hooks/useConfirm'
import useSnapKeepAlive from '@/hooks/useSnapKeepAlive'
import { RPCChannel } from '@/service/channel/RPCChannel'
import { WebRTCChannel } from '@/service/channel/WebRTCChannel'
import { PartyId } from '@/service/types'
import { MPCMessageType } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/CreateDialog.module.less'
import { tryToExtractChainId } from '@/utils/snapRequestUtil'

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

const SignDialog = () => {
  useSnapKeepAlive()

  const {
    interactive,
    messageModule,
    signModule,
    networkModule,
    accountModule,
  } = useStore()

  const { explorer, currentChain } = networkModule
  const { balanceEth } = accountModule

  const step = interactive.signStep
  const [webrtcChannel, setWebrtcChannel] = useState<WebRTCChannel>()

  const isSuccess = step > 3

  const setupRtcChannel = async () => {
    const rtcChannel = new WebRTCChannel('signChannel')
    setWebrtcChannel(rtcChannel)
    rtcChannel.on('channelOpen', async () => {
      setTimeout(async () => {
        const { method, originalMethod, params } = signModule.pendingRequest
        const thisChainId = tryToExtractChainId(originalMethod, params)
        const thisChainName = networkModule.getChainName(thisChainId)

        await rtcChannel.sendMessage(
          JSON.stringify({
            messageType: MPCMessageType.signPrepare,
            messageContent: {
              method: method,
              params: params,
              commonParams: {
                chainName: thisChainName,
                chainId: thisChainId,
                balance: balanceEth,
                nativeCurrency: currentChain?.nativeCurrency,
                // TODO set timestamp and formatTime
                timestamp: 0,
                formatTime: '--',
              },
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
    // TODO to ensure that some special explorer
    if (explorer) {
      window.open(`${explorer}/tx/${interactive.txHash}`)
    }
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

  useEffect(() => {
    const rpcChannel = new RPCChannel()
    messageModule.setRPCChannel(rpcChannel)
    messageModule.messageRelayer?.join(rpcChannel)

    setupRtcChannel()

    return () => {
      interactive.setCreateStep(1)
    }
  }, [])

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

export default observer(SignDialog)
