import { Button } from 'antd'
import { observer } from 'mobx-react-lite'
import { useContext, useEffect } from 'react'

import safeheron from '@/assets/safeheron.png'
import Loading from '@/components/Loading'
import { snap_origin } from '@/configs/snap'
import AddressCard from '@/containers/AddressCard'
import BackupDialog from '@/containers/BackupDialog'
import CheckShardDialog from '@/containers/CheckShardDialog'
import CreateDialog from '@/containers/CreateDialog'
import CreateOrImportGuide from '@/containers/CreateOrImportGuide'
import Header from '@/containers/Header'
import PendingRequestList from '@/containers/PendingRequestList'
import RecoverDialog from '@/containers/RecoverDialog'
import RecoverPrepareDialog from '@/containers/RecoverPrepareDialog'
import SignTransactionDialog from '@/containers/SignDialog'
import WalletNameDialog from '@/containers/WalletNameDialog'
import Welcome from '@/containers/Welcome'
import { MetamaskActions, MetaMaskContext } from '@/hooks/MetamaskContext'
import { useStore } from '@/store'
import styles from '@/styles/app/index.module.less'
import { connectSnap, getSnap, isLocalSnap } from '@/utils/snap'

const Home = () => {
  const { accountModule, interactive, recoveryModule, backupModule } =
    useStore()
  const {
    loading,
    walletNameDialogVisible,
    createDialogVisible,
    signTransactionDialogVisible,
  } = interactive

  const { backupDialogVisible, checkShardDialogVisible } = backupModule
  const { recoverDialogVisible, recoverPrepareDialogVisible } = recoveryModule
  const { address, requestAccountLoading } = accountModule

  const [state, dispatch] = useContext(MetaMaskContext)
  const isMetaMaskReady = isLocalSnap(snap_origin)
    ? state.isFlask
    : state.snapsDetected

  const connectMetamask = async () => {
    try {
      interactive.setLoading(true)
      await connectSnap()
      const installedSnap = await getSnap()

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      })
    } catch (e) {
      console.error('Connect Snap Error: ', e)
      dispatch({ type: MetamaskActions.SetError, payload: e })
    } finally {
      interactive.setLoading(false)
    }
  }

  const renderContent = () => {
    if (!state.installedSnap) return <Welcome />

    if (!address && requestAccountLoading) {
      return (
        <div
          style={{ textAlign: 'center', marginTop: '200px', height: '400px' }}>
          Request MPC Account...
        </div>
      )
    }

    if (address) {
      return (
        <>
          <AddressCard />
          <PendingRequestList />
        </>
      )
    }
    return <CreateOrImportGuide />
  }

  useEffect(() => {
    if (state.installedSnap) {
      accountModule.requestAccount()
    }
  }, [state.installedSnap])

  return (
    <>
      <Header>
        <Button
          disabled={!isMetaMaskReady || !!state.installedSnap}
          color={'primary'}
          onClick={connectMetamask}>
          {state.installedSnap ? 'Connected' : 'Connect MetaMask'}
        </Button>
      </Header>

      {renderContent()}

      <div className={styles.homePartner}>
        <h1>MPC Wallet Solution Powered by</h1>
        <img src={safeheron} width="120" />
      </div>

      <Loading loading={loading} />

      {walletNameDialogVisible && <WalletNameDialog />}
      {createDialogVisible && <CreateDialog />}
      {signTransactionDialogVisible && <SignTransactionDialog />}
      {backupDialogVisible && <BackupDialog />}
      {checkShardDialogVisible && <CheckShardDialog />}
      {recoverPrepareDialogVisible && <RecoverPrepareDialog />}
      {recoverDialogVisible && <RecoverDialog />}
    </>
  )
}

export default observer(Home)
