import { Button, Modal } from 'antd'
import { ChangeEvent, useState } from 'react'

import backup from '@/assets/backup.png'
import success from '@/assets/success.png'
import warn from '@/assets/warn.png'
import ButtonContainer from '@/components/ButtonContainer'
import MnemonicList from '@/components/MnemonicList'
import StepProgress from '@/components/StepProgress'
import { mnemonicInfoList } from '@/configs/text'
import useConfirm from '@/hooks/useConfirm'
import useSnapKeepAlive from '@/hooks/useSnapKeepAlive'
import { backupUpdate } from '@/service/metamask'
import { useStore } from '@/store'
import styles from '@/styles/containers/BackupDialog.module.less'
import { IS_PROD, randomFromArray } from '@/utils'

const steps = ['Backup', 'Verify', 'Complete']

const RANDOM_NUMBER = IS_PROD ? 6 : 1

const BackupDialog = () => {
  useSnapKeepAlive()

  const { accountModule, backupModule } = useStore()
  const { mnemonic } = backupModule

  const [step, setStep] = useState(0)
  const [lackMnemonic, setLackMnemonic] = useState<string[]>([])
  const [finallyMnemonic, setFinallyMnemonic] = useState<string[]>([])
  const [allFilled, setAllFilled] = useState(false)
  const [errorList, setErrorList] = useState<number[]>([])

  const prev = () => {
    setStep(step - 1)
  }

  const { showConfirm } = useConfirm()

  const [backupLoading, setBackupLoading] = useState(false)

  const next = async () => {
    if (step === 0) {
      showConfirm({
        content:
          'Please note that the current backup is for Private Key Shard A. When backing up shards, please label the backed-up phrase with its corresponding shard.',
        onOk: () => {},
      })
      setStep(1)
    } else if (step === 1) {
      const random = randomFromArray(mnemonic.split(/\s+/), RANDOM_NUMBER)
      setLackMnemonic(random)
      setFinallyMnemonic(random)
      setStep(2)
    } else if (step === 2) {
      setBackupLoading(true)
      const res = await backupModule.finishBackup()
      if (!res.success) return

      accountModule.setAccount(res.data)
      setStep(3)
      setBackupLoading(false)
    }
  }

  const onClose = () => {
    backupModule.setBackupDialogVisible(false)
    backupModule.setMnemonic('')
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, index) => {
    const newList = [
      ...finallyMnemonic.slice(0, index),
      e.target.value,
      ...finallyMnemonic.slice(index + 1),
    ]
    if (newList[index] !== getMnemonicList(mnemonic)[index]) {
      setErrorList([...new Set([...errorList, index])])
    } else {
      setErrorList(errorList.filter(v => v !== index))
    }
    if (newList.includes('')) {
      setAllFilled(false)
    } else {
      setAllFilled(true)
    }

    setFinallyMnemonic(newList)
  }

  const getMnemonicList = (text: string) => {
    return text.split(' ')
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ButtonContainer
            title="Backup Private Key Shard A"
            buttonContent={
              <>
                <Button onClick={prev}>Back</Button>

                <Button type="primary" onClick={next}>
                  Continue
                </Button>
              </>
            }>
            <StepProgress steps={steps} stepIndex={step} />
            <div className={styles.action}>
              <div className={styles.info}>
                <span className="warning">
                  Please write down these words in the correct order and save
                  theme in a secure place.
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

      case 2:
        return (
          <ButtonContainer
            title="Backup private key shard A"
            buttonContent={
              <>
                <Button onClick={prev}>Back</Button>

                <Button
                  type="primary"
                  onClick={next}
                  loading={backupLoading}
                  disabled={!(allFilled && !errorList.length)}>
                  Confirm
                </Button>
              </>
            }>
            <StepProgress steps={steps} stepIndex={step} />
            <div className={styles.action}>
              <div className={styles.info}>
                <span className="warning">
                  Fill in the blanks in the correct order to verify the accuracy
                  of the mnemonic phrase backup.
                </span>
              </div>
              <MnemonicList
                list={lackMnemonic}
                onChange={handleInputChange}
                errorList={[...errorList]}
              />

              {!!errorList.length && (
                <div className="error">
                  Wrong word. Please check it and try again.
                </div>
              )}
            </div>
          </ButtonContainer>
        )

      case 3:
        return (
          <ButtonContainer
            title="Backup private key shard A"
            buttonContent={
              <Button type="primary" onClick={onClose}>
                Done
              </Button>
            }>
            <StepProgress steps={steps} stepIndex={step} />
            <div className={styles.success}>
              <img src={success} width={100} />
              <span>Success</span>
              <p className="warning">
                Please ensure all private key shards (A, B, and C) have been
                backed up before using the wallet.
              </p>
            </div>
          </ButtonContainer>
        )

      default:
        return (
          <ButtonContainer
            title="Back Up Private Key Shard A"
            buttonContent={
              <>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="primary" onClick={next}>
                  Start Backup
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
                <li>Stay clear of cameras.</li>
                <li>
                  We suggest that you disconnect your device from the Internet
                  for offline backup.
                </li>
                <li>
                  Each mnemonic phrase matches a key shard (A, B, or C). When
                  backing up shards, please label the backed-up phrase with its
                  corresponding shard.
                </li>
                <li>
                  Once the wallet is backed up, it will automatically be added
                  to your MetaMask account.
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

export default BackupDialog
