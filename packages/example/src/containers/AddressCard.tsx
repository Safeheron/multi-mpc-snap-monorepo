import { Button, Popover } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useRef, useState } from 'react'

import copy from '@/assets/copy.png'
import dashboardImg from '@/assets/dashboard.png'
import logoDebank from '@/assets/logo-debank.png'
import logoMetaMask from '@/assets/logo-metamask.png'
import logoZapper from '@/assets/logo-zapper.png'
import logoZerion from '@/assets/logo-zerion.png'
import receive from '@/assets/receive.png'
import send from '@/assets/send.png'
import ActionPopover from '@/components/ActionPopover'
import { CACHE_ID_SYNC_ACCOUNT_TIP } from '@/configs/Configs'
import SendDialog from '@/containers/SendDialog'
import {
  backupApproval,
  checkMnemonic,
  syncAccountToMetamask,
} from '@/service/metamask'
import { useStore } from '@/store'
import styles from '@/styles/containers/AddressCard.module.less'
import { copyText, wei2eth } from '@/utils'

import AddressQrcode from './AddressQrcode'
import NotBackupDialog from './NotBackupDialog'

const DASHBOARD_LIST = [
  {
    skipJoinAddr: true,
    name: 'MetaMask Portfolio',
    logo: logoMetaMask,
    url: 'https://portfolio.metamask.io/',
  },
  {
    name: 'Zerion',
    logo: logoZerion,
    url: 'https://app.zerion.io/',
  },
  {
    name: 'DeBank',
    logo: logoDebank,
    url: `https://debank.com/profile/`,
  },
  {
    name: 'Zapper',
    logo: logoZapper,
    url: 'https://zapper.fi/account/',
  },
]

const AddressCard = () => {
  const { accountModule, interactive, transactionModule, networkModule } =
    useStore()
  const { address, walletName, balance, backuped, requestAccountLoading } =
    accountModule

  const [qrcodeVisible, setQrcodeVisible] = useState(false)
  const popoverRef = useRef<any>()

  const { hexChainId, chainName, fetchChainListFailed, currentChain } =
    networkModule

  const filledDashboardList = useMemo(() => {
    return DASHBOARD_LIST.map(d => {
      return {
        ...d,
        url: d.skipJoinAddr ? d.url : d.url + address,
      }
    })
  }, [address])

  const handleSend = () => {
    if (!backuped) {
      interactive.setNotBackupDialogVisible(true)
      return
    }

    interactive.setSendFormCompleted(false)
    interactive.setSendDialogVisible(true)
    transactionModule.setBaseTx({})
  }

  const handleReceive = () => {
    if (backuped) {
      setQrcodeVisible(true)
    } else {
      interactive.setNotBackupDialogVisible(true)
    }
  }

  const handleBackupApproval = async () => {
    popoverRef.current?.hide()
    interactive.setLoading(true)
    const res = await backupApproval(walletName)
    interactive.setLoading(false)

    if (res.success) {
      interactive.setSessionId(res.data.sessionId)
      interactive.setMnemonic(res.data.mnemonic)
      interactive.setBackupDialogVisible(true)
    }
  }

  const handleCheckShard = async () => {
    const res = await checkMnemonic(walletName)
    if (res.success) {
      interactive.setMnemonic(res.data)
      interactive.setCheckShardDialogVisible(true)
    }
  }

  const handleRecover = async () => {
    interactive.setRecoverPrepareDialogVisible(true)
  }

  const handleSyncAccountToMetaMask = async () => {
    interactive.setLoading(true)
    await syncAccountToMetamask()
    interactive.setLoading(false)
  }

  const [mentioned, setMentioned] = useState(false)
  const setup = () => {
    const tipCache = localStorage.getItem(CACHE_ID_SYNC_ACCOUNT_TIP)
    setMentioned(Boolean(tipCache))
  }

  const hideTip = () => {
    setMentioned(true)
    localStorage.setItem(CACHE_ID_SYNC_ACCOUNT_TIP, '1')
  }

  useEffect(() => {
    setup()
  }, [])

  return (
    <div className={styles.addressCard}>
      <div className={styles.network}>
        {fetchChainListFailed && <span>ChainId: {parseInt(hexChainId)}</span>}
        {chainName && <span>{chainName}</span>}
      </div>

      {!mentioned && backuped && (
        <p className={styles.tip}>
          The wallet has been added to your MetaMask account. You can now
          directly use the wallet in MetaMask. <a onClick={hideTip}>Hide</a>
        </p>
      )}

      <div className={styles.account}>
        <h1>{walletName || 'test'} </h1>
        {backuped ? (
          <p>
            <span>{address}</span>
            <img src={copy} onClick={() => copyText(address, 'Address')} />
          </p>
        ) : (
          <p className={styles.backup}>
            Your wallet has not been backed up yet. <br />
            Please
            <a onClick={handleBackupApproval}> complete the backup </a>
            timely to ensure asset security.
          </p>
        )}
        <h2>
          {wei2eth(balance)} {currentChain?.nativeCurrency.symbol}
        </h2>
      </div>

      <div className={styles.action}>
        <Button onClick={handleSend}>
          <img src={send} alt="" />
          <span>Send</span>
        </Button>
        <Button onClick={handleReceive}>
          <img src={receive} alt="" />
          <span>Receive</span>
        </Button>
        {address && backuped && (
          <Popover
            content={
              <div className={styles.dashboardContent}>
                <div>You can track your assets through these dashboards:</div>
                {filledDashboardList.map(d => (
                  <div key={d.name} className={styles.dashboardWrapper}>
                    <img className={styles.dashboardLogo} src={d.logo} alt="" />
                    <a href={d.url} target={'_blank'}>
                      {d.name}
                    </a>
                  </div>
                ))}
              </div>
            }
            placement={'bottom'}
            trigger="click">
            <Button>
              <img src={dashboardImg} alt="" />
              <span>Dashboard</span>
            </Button>
          </Popover>
        )}
      </div>
      <div className={styles.more}>
        <ActionPopover
          ref={popoverRef}
          content={
            <>
              {!backuped && (
                <a onClick={handleBackupApproval}>Backup My Wallet</a>
              )}

              {backuped && (
                <>
                  <a onClick={handleCheckShard}>View Key Shard A</a>
                  <a onClick={handleRecover}>Recover for Other Device</a>
                  <a onClick={handleSyncAccountToMetaMask}>Add to MetaMask</a>
                </>
              )}
            </>
          }
        />
      </div>
      <AddressQrcode
        address={address}
        visible={qrcodeVisible}
        onClose={() => setQrcodeVisible(false)}
      />
      {interactive.sendDialogVisible && <SendDialog />}
      {interactive.notBackupDialogVisible && (
        <NotBackupDialog onSubmit={handleBackupApproval} />
      )}
    </div>
  )
}

export default observer(AddressCard)
