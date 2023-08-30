import { observer } from 'mobx-react-lite'

import InstallReminder from '@/components/InstallReminder'
import { test } from '@/service/metamask'
import { useStore } from '@/store'
import styles from '@/styles/containers/CreateOrImportGuide.module.less'

const CreateOrImportGuide = () => {
  const { interactive } = useStore()

  const handleCreate = async () => {
    interactive.setWalletNameDialogVisible(true)
  }
  const handleTest = async () => {
    const res = await test()
    console.log(res)
  }
  const handleRecover = async () => {
    interactive.setRecoverPrepareDialogVisible(true)
  }

  return (
    <div className={styles.guide}>
      <section>
        <div className={styles.box} onClick={handleCreate}>
          <div>Create a new MPC Wallet</div>
          {/*<div className={styles.tip}>*/}
          {/*  The wallet you created will be automatically added to your MetaMask*/}
          {/*  Account. You can directly use the MPC wallet in MetaMask.*/}
          {/*</div>*/}
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
