import { Button, List, message } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'

import Loading from '@/components/Loading'
import AddressCard from '@/containers/AddressCard'
import BackupDialog from '@/containers/BackupDialog'
import CheckShardDialog from '@/containers/CheckShardDialog'
import CreateDialog from '@/containers/CreateDialog'
import CreateOrImportGuide from '@/containers/CreateOrImportGuide'
import Header from '@/containers/Header'
import RecoverDialog from '@/containers/RecoverDialog'
import RecoverPrepareDialog from '@/containers/RecoverPrepareDialog'
import SignTransactionDialog from '@/containers/SignTransactionDialog'
import TransactionList from '@/containers/TransactionList'
import WalletNameDialog from '@/containers/WalletNameDialog'
import Welcome from '@/containers/Welcome'
import { connect, getSnaps, heartBeat, SNAP_ID } from '@/service/metamask'
import { useStore } from '@/store'
import { isMetaMaskSnapsSupported } from '@/utils'

const Home = () => {
  const { accountModule, interactive, snapRequestModule } = useStore()
  const {
    loading,
    walletNameDialogVisible,
    createDialogVisible,
    signTransactionDialogVisible,
    backupDialogVisible,
    checkShardDialogVisible,
    recoverDialogVisible,
    recoverPrepareDialogVisible,
  } = interactive
  const { address, network } = accountModule
  const { requests } = snapRequestModule

  const [isSupportMetamaskFlask, setIsSupportMetamaskFlask] = useState(false)
  const [isInstallMPCSnap, setIsInstallMPCSnap] = useState(false)
  const [connected, setConnected] = useState(false)

  const heartTimer = useRef<any>()

  const detectEnvironment = async () => {
    await accountModule.getNetwork()

    await detectFlaskInstalled()
    await detectMPCSnapInstalled()
  }

  const detectFlaskInstalled = async () => {
    const isSupportedFlask = await isMetaMaskSnapsSupported()
    setIsSupportMetamaskFlask(isSupportedFlask)
    return isSupportedFlask
  }

  const detectMPCSnapInstalled = async () => {
    return false
    let mpcSnapInstalled = false
    try {
      const snaps = await getSnaps()
      mpcSnapInstalled = Boolean(snaps?.[SNAP_ID]?.enabled)
    } catch (e) {
      console.error('Detect snap installed occur an error ', e)
    }
    setIsInstallMPCSnap(mpcSnapInstalled)
    return mpcSnapInstalled
  }

  const startHeartBeat = () => {
    console.log('start heart beat....')
    stopHeartBeat()
    heartTimer.current = setInterval(() => {
      heartBeat()
    }, 30 * 1000)
  }

  const stopHeartBeat = () => {
    clearInterval(heartTimer.current)
  }

  const requestMPCAccount = async () => {
    await accountModule.requestAccount()
  }

  const connectFlask = async () => {
    if (!isSupportMetamaskFlask) {
      message.error('Flask not enable, please reload')
      return
    }

    interactive.setLoading(true)
    if (!isInstallMPCSnap) {
      const connectRes = await connect()

      if (connectRes.success) {
        setIsInstallMPCSnap(true)
        setConnected(true)
        await requestMPCAccount()
      } else {
        message.error(connectRes.message)
      }
    } else {
      await requestMPCAccount()
      setConnected(true)
    }
    interactive.setLoading(false)
    startHeartBeat()
    snapRequestModule.startLoopRequest()
  }

  const resolveRequest = (requestId: string) => {
    const request = requests.find(r => r.request.id === requestId)
  }

  useEffect(() => {
    detectEnvironment()

    return () => {
      clearInterval(heartTimer.current)
    }
  }, [])

  return (
    <>
      <Header>
        <Button disabled={connected} color={'primary'} onClick={connectFlask}>
          {connected ? 'Connected' : 'Connect Metamask Flask'}
        </Button>
      </Header>

      {connected ? (
        !address ? (
          <CreateOrImportGuide />
        ) : (
          <>
            <AddressCard />
            <List
              itemLayout="horizontal"
              dataSource={requests}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <a
                      key={item.request.id}
                      onClick={() => resolveRequest(item.request.id)}>
                      Handle This Request
                    </a>,
                  ]}>
                  <List.Item.Meta
                    title={'Request Type::' + item.request.method}
                    description={JSON.stringify(item)}
                  />
                </List.Item>
              )}
            />
            {network.chainId && <TransactionList />}
          </>
        )
      ) : (
        <Welcome />
      )}

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
