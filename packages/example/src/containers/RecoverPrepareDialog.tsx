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
          title={'Recover an MPC Wallet'}
          desc={
            <p>
              To recover an MPC Wallet, make sure you have MetaMask Flask on
              your Google Chrome and the Safeheron Snap App on two separate
              phones.
              <br /> <br />
              Moreover, for wallet recovery, you'll need at least two out of the
              three backed-up private key shards (A, B, and C).
              <br /> <br />
              Using all three shards will keep the wallet address unchanged.
              <br /> <br />
              Using two shards will also retain the wallet address, but remember
              to back up the recovered private key shard before using the
              wallet.
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
