import { Button, Modal } from 'antd'
import { ChangeEvent, useState } from 'react'

import backup from '@/assets/backup.png'
import success from '@/assets/success.png'
import warn from '@/assets/warn.png'
import ButtonContainer from '@/components/ButtonContainer'
import MnemonicList from '@/components/MnemonicList'
import StepProgress from '@/components/StepProgress'
import { mnemonicInfoList } from '@/configs/text'
import { backupUpdate } from '@/service/metamask'
import { useStore } from '@/store'
import styles from '@/styles/containers/BackupDialog.module.less'
import { IS_PROD, randomFromArray } from '@/utils'

const steps = ['Backup', 'Verify', 'Finish']
const RANDOM_NUMBER = IS_PROD ? 6 : 1
const BackupDialog = () => {
  const { interactive, accountModule } = useStore()
  const { mnemonic } = interactive

  const [step, setStep] = useState(0)
  const [lackMnemonic, setLackMnemonic] = useState<string[]>([])
  const [finallyMnemonic, setFinallyMnemonic] = useState<string[]>([])
  const [allFilled, setAllFilled] = useState(false)
  const [errorList, setErrorList] = useState<number[]>([])

  const prev = () => {
    setStep(step - 1)
  }

  const next = async () => {
    if (step === 1) {
      const random = randomFromArray(mnemonic.split(/\s+/), RANDOM_NUMBER)
      setLackMnemonic(random)
      setFinallyMnemonic(random)
    } else if (step === 2) {
      const res = await backupUpdate(interactive.sessionId)
      if (!res.success) return
      accountModule.setAccount(res.data)
    }
    setStep(step + 1)
  }

  const onClose = () => {
    interactive.setBackupDialogVisible(false)
    interactive.setMnemonic('')
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
            title="Backup private key shard A"
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
                  disabled={!(allFilled && !errorList.length)}>
                  Confirm
                </Button>
              </>
            }>
            <StepProgress steps={steps} stepIndex={step} />
            <div className={styles.action}>
              <div className={styles.info}>
                <span className="warning">
                  Please write down these words in the correct order and keep
                  them in a safe place
                </span>
              </div>
              <MnemonicList
                list={lackMnemonic}
                onChange={handleInputChange}
                errorList={[...errorList]}
              />

              {!!errorList.length && (
                <div className="error">
                  Fill in the error, please proofread and try again
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
                Please ensure that private key shards A, B, and C have all been
                backed up before starting to use the wallet.
              </p>
            </div>
          </ButtonContainer>
        )

      default:
        return (
          <ButtonContainer
            title="About to start backing up private key shard A"
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
                shards, A, B, and C, distributed across MetaMask Snap, Safeheron
                Snap App 1, and Safeheron Snap App 2 You must complete the
                backup of all three private key shards before you can start
                using the wallet.
              </p>
              <ul className={styles.warnList}>
                <li>Please be careful to avoid the camera.</li>
                <li>
                  We recommend that you disconnect from the internet and perform
                  an offline backup.
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
