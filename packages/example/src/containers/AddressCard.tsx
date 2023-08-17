import { Button } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'

import copy from '@/assets/copy.png'
import receive from '@/assets/receive.png'
import send from '@/assets/send.png'
import ActionPopover from '@/components/ActionPopover'
import SendDialog from '@/containers/SendDialog'
import useConfirm from '@/hooks/useConfirm'
import { backupApproval, checkMnemonic, deleteWallet } from '@/service/metamask'
import { useStore } from '@/store'
import styles from '@/styles/containers/AddressCard.module.less'
import { copyText, wei2eth } from '@/utils'

import AddressQrcode from './AddressQrcode'
import NotBackupDialog from './NotBackupDialog'

const AddressCard = () => {
  const { accountModule, interactive, transactionModule } = useStore()
  const { address, walletName, balance, network, backuped } = accountModule
  const [qrcodeVisible, setQrcodeVisible] = useState(false)
  const popoverRef = useRef<any>()
  const { showConfirm, showInfo } = useConfirm()

  useEffect(() => {
    accountModule.getNetwork()
  }, [])

  const handleDelete = async () => {
    interactive.setLoading(true)
    const res = await deleteWallet()
    interactive.setLoading(false)
    console.log('handleDelete', res)

    if (res.success) {
      window.location.reload()
    }
  }

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
    console.log(res)

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

  return (
    <div className={styles.addressCard}>
      <div className={styles.network}>
        <span>{network.name}</span>
      </div>

      <div className={styles.account}>
        <h1>{walletName || 'test'} </h1>
        {backuped ? (
          <p>
            <span>{address}</span>{' '}
            <img src={copy} onClick={() => copyText(address, 'Address')} />
          </p>
        ) : (
          <p className={styles.backup}>
            Your wallet has not been backed up yet. <br />
            Please
            <a onClick={handleBackupApproval}> complete the backup </a>
            in a timely manner to ensure asset security.
          </p>
        )}
        <h2>{wei2eth(balance)} ETH</h2>
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
      </div>
      <div className={styles.more}>
        <ActionPopover
          ref={popoverRef}
          content={
            <>
              {!backuped && (
                <a onClick={handleBackupApproval}>Backup the wallet</a>
              )}

              {backuped && (
                <a onClick={handleCheckShard}>Check the Key Shard A</a>
              )}
              {backuped && (
                <a onClick={handleRecover}>Recovery for other device</a>
              )}
              {/*<a onClick={handleDelete}>Delete</a>*/}
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
