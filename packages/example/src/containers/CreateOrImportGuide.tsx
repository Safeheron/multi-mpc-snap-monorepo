import { observer } from 'mobx-react-lite'

import InstallReminder from '@/components/InstallReminder'
import { useStore } from '@/store'
import styles from '@/styles/containers/CreateOrImportGuide.module.less'

const CreateOrImportGuide = () => {
  const { interactive } = useStore()

  const handleCreate = async () => {
    interactive.setWalletNameDialogVisible(true)
  }

  const handleRecover = async () => {
    interactive.setRecoverPrepareDialogVisible(true)
  }

  return (
    <div className={styles.guide}>
      <section>
        <div className={styles.box} onClick={handleCreate}>
          <div>Create a new MPC Wallet</div>
        </div>

        <div className={styles.box} onClick={handleRecover}>
          <span>
            I already have an MPC wallet. <br /> Recover the wallet.
          </span>
        </div>
      </section>
      <div className={styles.line}></div>
      <InstallReminder />
    </div>
  )
}

export default observer(CreateOrImportGuide)
