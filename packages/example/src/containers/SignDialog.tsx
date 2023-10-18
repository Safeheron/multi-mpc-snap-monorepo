import {
  OperationType,
  SignPrepareParams,
  SignReadyMessage,
} from '@safeheron/mpcsnap-types'
import { SignPrepareMessage } from '@safeheron/mpcsnap-types/src/relay-message/sign'
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
import { formatToUSDateTime } from '@/utils/dateUtil'

const steps = [
  {
    title: 'Step 1: Connect to Safeheron Snap App on one phone',
    desc: `Open Safeheron Snap App and click on “MPC Sign”. Place the QR code in front of your desktop’s camera.`,
    successText: 'Connected',
  },
  {
    title:
      'Step 2: Confirm the transaction on the connected Safeheron Snap App',
    successText: 'Confirmed',
  },
  {
    title:
      'Step 3: Keep the Safeheron Snap App open and do not switch to other pages. Wait for transaction success',
    successText: 'Success',
    loadingText:
      'Waiting for the two devices to compute and sign the transaction.',
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

  const { currentChain } = networkModule
  const { balanceEth, walletId } = accountModule

  const step = interactive.signStep
  const [webrtcChannel, setWebrtcChannel] = useState<WebRTCChannel>()

  const isSuccess = step > 3

  const setupRtcChannel = async () => {
    const rtcChannel = new WebRTCChannel('signChannel')
    setWebrtcChannel(rtcChannel)
    rtcChannel.on('channelOpen', async () => {
      setTimeout(async () => {
        const {
          method,
          params,
          createTime,
          chainId: thisChainId,
        } = signModule.pendingRequest
        const thisChainName = networkModule.getChainName(thisChainId)

        const signPrepareParams: SignPrepareMessage = {
          messageType: OperationType.signPrepare,
          messageContent: {
            walletId,
            method: method,
            params: params,
            commonParams: {
              chainName: thisChainName,
              chainId: thisChainId,
              balance: balanceEth,
              nativeCurrency: currentChain?.nativeCurrency,
              timestamp: createTime,
              formatTime: formatToUSDateTime(createTime),
            },
          },
        }
        await rtcChannel.sendMessage(JSON.stringify(signPrepareParams))

        const signReadyMessage: SignReadyMessage = {
          messageType: OperationType.signReady,
          messageContent: {
            participants: [PartyId.A, rtcChannel.getPartyId()],
            pub: signModule.communicationPub,
          },
        }
        messageModule.rpcChannel?.next(signReadyMessage)

        interactive.setSignStep(2)
      }, 1000)
    })

    messageModule.messageRelayer?.join(rtcChannel)
  }

  const handleTxnHash = async () => {
    const { method, params, chainId: thisChainId } = signModule.pendingRequest
    const explorer = networkModule.getExplorer(thisChainId)
    if (explorer && interactive.txHash) {
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

    interactive.setTxHash('')

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
                {interactive.txHash && (
                  <Button
                    type="primary"
                    onClick={handleTxnHash}
                    style={{ marginRight: 30 }}>
                    Txn Hash
                  </Button>
                )}

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
                <WebRTCConnection
                  webrtcChannel={webrtcChannel}
                  businessType={'sign'}
                />
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
