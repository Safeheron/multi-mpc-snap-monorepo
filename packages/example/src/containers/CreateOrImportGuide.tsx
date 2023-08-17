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
        <a onClick={handleCreate}>
          <span>Create a new MPC Wallet</span>
        </a>

        {/* <a onClick={handleTest}>
          <span>test</span>
        </a> */}

        <a onClick={handleRecover}>
          <span>
            I have an MPC wallet already. <br /> Recover the wallet.
          </span>
        </a>
      </section>
      {/* <p>
        Forgot your Snap Key Shard?{' '}
        <a href=""> Recover with Safeheron Snap App and Keystone</a>(Coming
        Soon)
      </p> */}
      <div className={styles.line}></div>
      <InstallReminder />
    </div>
  )
}

export default observer(CreateOrImportGuide)
