import { Loading3QuartersOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { observer } from 'mobx-react-lite'
import { useContext, useEffect, useMemo } from 'react'
import styled from 'styled-components'

import MetaMaskFox from '@/assets/metamask-fox.svg'
import safeheron from '@/assets/safeheron.png'
import Loading from '@/components/Loading'
import AddressCard from '@/containers/AddressCard'
import BackupDialog from '@/containers/BackupDialog'
import BetaWarning from '@/containers/BetaWarning'
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
import { remindUserAfterFirstInstall } from '@/service/metamask'
import { useStore } from '@/store'
import styles from '@/styles/app/index.module.less'
import { connectSnap, getSnap, isLocalSnap } from '@/utils/snap'

const HomeWrap = styled.div`
  width: 100%;
  padding-top: 73px;

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #76d572;
    vertical-align: middle;
    margin-right: 8px;
  }
`

const HomeContainer = styled.div`
  width: 1044px;
  margin: 0 auto;
`

const Home = () => {
  const {
    accountModule,
    interactive,
    recoveryModule,
    backupModule,
    signModule,
    keygenModule,
  } = useStore()
  const { loading } = interactive
  const { walletNameDialogVisible, createDialogVisible } = keygenModule
  const { signTransactionDialogVisible } = signModule
  const { backupDialogVisible, checkShardDialogVisible } = backupModule
  const { recoverDialogVisible, recoverPrepareDialogVisible } = recoveryModule
  const { address, requestAccountLoading } = accountModule

  const [state, dispatch] = useContext(MetaMaskContext)

  const isLocal = useMemo(
    () => isLocalSnap(state.installedSnap?.id ?? ''),
    [state.installedSnap]
  )

  const connectMetamask = async () => {
    if (!state.supportedSnap) {
      message.warning('You should install MetaMask first.')
      return
    }
    try {
      interactive.setLoading(true)
      await connectSnap()
      const installedSnap = await getSnap()

      await remindUserAfterFirstInstall()

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
    if (!state.installedSnap?.id) return <Welcome />

    if (!address && requestAccountLoading) {
      return (
        <div
          style={{ textAlign: 'center', marginTop: '200px', height: '300px' }}>
          <Loading3QuartersOutlined
            style={{ fontSize: 42, color: '#496ce9' }}
            spin
          />
          <p style={{ marginTop: '16px' }}>Request Account...</p>
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
    <HomeWrap>
      <Header>
        <Button
          disabled={!isLocal && (!state.supportedSnap || !!state.installedSnap)}
          color={'primary'}
          onClick={connectMetamask}>
          {state.installedSnap && <span className={'dot'}></span>}
          {!state.installedSnap && (
            <span
              style={{
                verticalAlign: 'middle',
                marginRight: '10px',
                display: 'inline-block',
              }}>
              <MetaMaskFox />
            </span>
          )}
          {state.installedSnap
            ? isLocal
              ? 'Reconnect'
              : 'Connected'
            : 'Connect MetaMask'}
        </Button>
      </Header>

      <BetaWarning />

      <HomeContainer>
        {renderContent()}

        <div className={styles.homePartner}>
          <h1>MPC Wallet Solution Powered by</h1>
          <a target={'_blank'} href={'https://www.safeheron.com'}>
            <img src={safeheron} width="120" />
          </a>
        </div>

        <Loading loading={loading} />

        {walletNameDialogVisible && <WalletNameDialog />}
        {createDialogVisible && <CreateDialog />}
        {signTransactionDialogVisible && <SignTransactionDialog />}
        {backupDialogVisible && <BackupDialog />}
        {checkShardDialogVisible && <CheckShardDialog />}
        {recoverPrepareDialogVisible && <RecoverPrepareDialog />}
        {recoverDialogVisible && <RecoverDialog />}
      </HomeContainer>
    </HomeWrap>
  )
}

export default observer(Home)
