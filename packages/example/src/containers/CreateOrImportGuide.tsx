import { observer } from 'mobx-react-lite'

import InstallReminder from '@/components/InstallReminder'
import { useStore } from '@/store'
import styles from '@/styles/containers/CreateOrImportGuide.module.less'

const CreateOrImportGuide = () => {
  const { recoveryModule, keygenModule } = useStore()

  const handleCreate = async () => {
    keygenModule.setWalletNameDialogVisible(true)
  }

  const handleRecover = async () => {
    recoveryModule.setRecoverPrepareDialogVisible(true)
  }

  return (
    <div className={styles.guide}>
      <section>
        <div className={styles.box} onClick={handleCreate}>
          <div>Create a new MPC Wallet</div>
        </div>

        <div className={styles.box} onClick={handleRecover}>
          <div>Recover my MPC Wallet</div>
        </div>
      </section>
      <div className={styles.line}></div>
      <InstallReminder />
    </div>
  )
}

export default observer(CreateOrImportGuide)
