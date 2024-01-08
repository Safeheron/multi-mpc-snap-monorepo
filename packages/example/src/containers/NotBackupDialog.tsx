import { Button, Modal } from 'antd'

import ButtonContainer from '@/components/ButtonContainer'
import { useStore } from '@/store'
import styles from '@/styles/containers/NotBackupDialog.module.less'

const NotBackupDialog = ({ onSubmit }) => {
  const { interactive, accountModule, backupModule } = useStore()

  const handleSubmit = () => {
    backupModule.setNotBackupDialogVisible(false)
    onSubmit()
  }

  const handleBackupApproval = async () => {
    interactive.setLoading(true)
    const res = await backupModule.requestBackupApproval(
      accountModule.walletName
    )
    interactive.setLoading(false)

    if (res.success) {
      backupModule.setNotBackupDialogVisible(false)
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
                onClick={() => backupModule.setNotBackupDialogVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleSubmit}>
                Backup
              </Button>
            </>
          }>
          Your wallet has not been backed up yet. Please{' '}
          <a onClick={handleBackupApproval}>complete the backup</a> timely to
          ensure asset security.
        </ButtonContainer>
      </div>
    </Modal>
  )
}

export default NotBackupDialog
