import { Button, Modal } from 'antd'
import { useState } from 'react'

import backup from '@/assets/backup.png'
import warn from '@/assets/warn.png'
import ButtonContainer from '@/components/ButtonContainer'
import MnemonicList from '@/components/MnemonicList'
import { mnemonicInfoList } from '@/configs/text'
import { useStore } from '@/store'
import styles from '@/styles/containers/BackupDialog.module.less'

const CheckShardDialog = () => {
  const { backupModule } = useStore()
  const { mnemonic } = backupModule
  const [step, setStep] = useState(0)

  const prev = () => {
    setStep(step - 1)
  }

  const next = async () => {
    setStep(step + 1)
  }

  const onClose = () => {
    backupModule.setCheckShardDialogVisible(false)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ButtonContainer
            title="Private Key Shard A"
            buttonContent={
              <Button type="primary" onClick={onClose}>
                Done
              </Button>
            }>
            <div className={styles.action}>
              <div className={styles.info}>
                <span className="warning">
                  Please write down these words in the correct order and save
                  them in a secure place.
                </span>
              </div>

              <MnemonicList list={mnemonic.split(' ')} copyable />
              <ul className={styles.infoList}>
                {mnemonicInfoList.map((v, i) => (
                  <li key={i}>
                    <h2>
                      <img src={warn} alt="" />
                      {v.title}
                    </h2>
                    <p>{v.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </ButtonContainer>
        )

      default:
        return (
          <ButtonContainer
            title="About to start viewing private key shard A"
            buttonContent={
              <>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="primary" onClick={next}>
                  Continue
                </Button>
              </>
            }>
            <div className={styles.about}>
              <img src={backup} alt="" />
              <p>
                The MPC wallet created in Safeheron Snap has three private key
                shards, A, B, and C which are distributed across MetaMask
                Extension and 2 mobile phones with the Safeheron Snap App
                installed. Please complete the backup of the three key shards
                before using the wallet.
              </p>
              <ul className={styles.warnList}>
                <li>Stay clear of cameras devices.</li>
                <li>
                  We suggest that you disconnect your device from the Internet
                  for offline backup.
                </li>
              </ul>
            </div>
          </ButtonContainer>
        )
    }
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={720}>
      <div className={styles.backupDialog}>{renderStep()}</div>
    </Modal>
  )
}

export default CheckShardDialog
