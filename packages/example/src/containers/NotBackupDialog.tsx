import { Button, Modal } from 'antd'

import ButtonContainer from '@/components/ButtonContainer'
import { backupApproval } from '@/service/metamask'
import { useStore } from '@/store'
import styles from '@/styles/containers/NotBackupDialog.module.less'

const NotBackupDialog = ({ onSubmit }) => {
  const { interactive, accountModule } = useStore()

  const handleSubmit = () => {
    interactive.setNotBackupDialogVisible(false)
    onSubmit()
  }

  const handleBackupApproval = async () => {
    interactive.setLoading(true)
    const res = await backupApproval(accountModule.walletName)
    interactive.setLoading(false)
    console.log(res)

    if (res.success) {
      interactive.setSessionId(res.data.sessionId)
      interactive.setMnemonic(res.data.mnemonic)
      interactive.setBackupDialogVisible(true)
    }
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={520}>
      <div className={styles.notBackupDialog}>
        <ButtonContainer
          title="Please backup your wallet first"
          buttonContent={
            <>
              <Button
                onClick={() => interactive.setNotBackupDialogVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleSubmit}>
                Backup
              </Button>
            </>
          }>
          Your wallet has not been backed up yet. Please{' '}
          <a onClick={handleBackupApproval}>complete the backup</a> in a timely
          manner to ensure asset security
        </ButtonContainer>
      </div>
    </Modal>
  )
}

export default NotBackupDialog
