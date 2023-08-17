import { Button, Modal } from 'antd'
import { observer } from 'mobx-react-lite'

import ButtonContainer from '@/components/ButtonContainer'
import { RPCChannel } from '@/service/channel/RPCChannel'
import { recoverApproval } from '@/service/metamask'
import MessageRelayer from '@/service/relayer/MessageRelayer'
import { PartyId } from '@/service/types'
import { MPCMessageType } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/RecoverPrepareDialog.module.less'

const RecoverPrepareDialog = () => {
  const { interactive, accountModule, messageModule } = useStore()
  const handleRecover = async () => {
    interactive.setRecoverPrepareDialogVisible(false)
    interactive.setLoading(true)
    const res = await recoverApproval(accountModule.walletName)
    interactive.setLoading(false)
    if (res.success) {
      interactive.setSessionId(res.data.sessionId)
      interactive.setMnemonic(res.data.mnemonic)
      await startRecover()
    }
  }

  const startRecover = async () => {
    const rpcChannel = new RPCChannel()
    messageModule.setRPCChannel(rpcChannel)
    const messageRelayer = new MessageRelayer(3)
    messageModule.setMessageRelayer(messageRelayer)
    messageRelayer.join(rpcChannel)

    rpcChannel.next({
      messageType: MPCMessageType.roleReady,
      messageContent: {
        partyId: PartyId.A,
        index: 1,
      },
    })
    interactive.setRecoverStep(1)
    interactive.setRecoverDialogVisible(true)
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={720}>
      <div className={styles.recoverPrepareDialog}>
        <ButtonContainer
          title={'Start restoring an MPC Wallet'}
          desc={
            <p>
              If you need to recover an MPC Wallet, please ensure that you have
              MetaMask Flask installed in your Chrome and have installed the
              Safeheron Snap App on two different phones.
              <br /> <br />
              In addition, to recover the wallet, you will need at least two of
              the three private key shards (A, B, C) that you have backed up.
              <br /> <br />
              If you use three private key shards for recovery, the wallet
              address will remain the same.
              <br /> <br />
              If you use two private key shards for recovery, the wallet address
              will remain the same, but you will need to back up the recovered
              private key shard before you can use the wallet.
            </p>
          }
          buttonContent={
            <>
              <Button
                onClick={() =>
                  interactive.setRecoverPrepareDialogVisible(false)
                }>
                Cancel
              </Button>

              <Button type="primary" onClick={handleRecover}>
                Continue
              </Button>
            </>
          }
        />
      </div>
    </Modal>
  )
}

export default observer(RecoverPrepareDialog)
