import { OperationType, RoleReadyMessage } from '@safeheron/mpcsnap-types'
import { Button, Modal } from 'antd'
import { observer } from 'mobx-react-lite'

import ButtonContainer from '@/components/ButtonContainer'
import recoverAction from '@/service/action/RecoverAction'
import { RPCChannel } from '@/service/channel/RPCChannel'
import { recoverApproval } from '@/service/metamask'
import MessageRelayer from '@/service/relayer/MessageRelayer'
import { PartyId } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/RecoverPrepareDialog.module.less'

const RecoverPrepareDialog = () => {
  const { interactive, accountModule, recoveryModule } = useStore()

  const handleRecover = async () => {
    recoveryModule.setRecoverPrepareDialogVisible(false)
    interactive.setLoading(true)

    recoverAction.destroy()
    recoverAction.cleanup()

    const res = await recoverApproval(accountModule.walletName)

    interactive.setLoading(false)

    if (res.success) {
      recoveryModule.setSessionId(res.data.sessionId)
      recoveryModule.setLocalKeyshareExist(res.data.keyshareExist)
      recoveryModule.setLocalCommunicationPub(res.data.pub)
      await startRecover()
    }
  }

  const startRecover = async () => {
    const rpcChannel = new RPCChannel()
    recoveryModule.setRPCChannel(rpcChannel)

    const messageRelayer = new MessageRelayer(3)
    recoveryModule.setMessageRelayer(messageRelayer)

    messageRelayer.join(rpcChannel)

    const roleReadyMessage: RoleReadyMessage = {
      messageType: OperationType.roleReady,
      messageContent: {
        partyId: PartyId.A,
        index: 1,
        walletId: accountModule.walletId,
        pub: recoveryModule.localCommunicationPub,
        walletName: accountModule.walletName,
        hasKeyShare: recoveryModule.localKeyshareExist,
      },
    }

    // @ts-ignore
    rpcChannel.next(roleReadyMessage)
    recoveryModule.setRecoverStep(1)
    recoveryModule.setRecoverDialogVisible(true)
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={720}>
      <div className={styles.recoverPrepareDialog}>
        <ButtonContainer
          title={'Recover an MPC Wallet'}
          desc={
            <p>
              To recover an MPC Wallet, please make sure you have MetaMask on
              your browser and the Safeheron Snap App on two separate phones.
              <br /> <br />
              For wallet recovery, you'll need at least two out of the three
              backed-up private key shards (A, B, and C).
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
                  recoveryModule.setRecoverPrepareDialogVisible(false)
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
