import { OperationType } from '@safeheron/mpcsnap-types'
import { Button, Form, Input } from 'antd'
import { observer } from 'mobx-react-lite'

import noNeed from '@/assets/no-need.png'
import waiting from '@/assets/waiting.png'
import useConfirm from '@/hooks/useConfirm'
import { PartyId } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/MnemonicForm.module.less'
import { mnemonicValidator } from '@/utils/validator'

const MnemonicForm = () => {
  const [form] = Form.useForm()
  const { recoveryModule } = useStore()
  const { showConfirm, showInfo } = useConfirm()

  const handleSkip = async () => {
    if (recoveryModule.isSkip) {
      showInfo({
        content:
          'A minimum of 2 private key shards is necessary for wallet recovery. If other devices have already bypassed entering the mnemonic phrase, this device can no longer skip this step. Please input the mnemonic phrase for this device.',
      })
      return
    }

    try {
      if (!recoveryModule.hasOtherShard) {
        await form.validateFields(['walletName'])
      }
      showConfirm({
        content:
          'The wallet address will remain the same, but remember to back up the recovered private key shard before using the wallet.',
        onOk() {
          const walletName = form.getFieldValue('walletName')

          recoveryModule.setInputMnemonic('')
          recoveryModule.setWalletName(walletName)

          recoveryModule.rpcChannel?.next({
            sendType: 'broadcast',
            messageType: OperationType.mnemonicSkip,
            messageContent: null,
          })

          recoveryModule.rpcChannel?.next({
            messageType: OperationType.mnemonicReady,
            messageContent: {
              walletName,
              hasMnemonic: false,
              partyId: PartyId.A,
            },
          })

          recoveryModule.setMnemonicFormType('done')
        },
      })
    } catch (error) {
      // no op
    }
  }
  const onFinish = values => {
    recoveryModule.setWalletName(values.walletName)
    recoveryModule.setInputMnemonic(values.mnemonic)
    recoveryModule.setMnemonicFormType('done')

    recoveryModule.rpcChannel?.next({
      messageType: OperationType.mnemonicReady,
      messageContent: {
        walletName: values.walletName,
        hasMnemonic: true,
        partyId: PartyId.A,
      },
    })
  }

  return (
    <>
      {recoveryModule.mnemonicFormType === 'init' ? (
        <Form
          form={form}
          name="mnemonicForm"
          className={styles.mnemonicForm}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}>
          {!(
            recoveryModule.hasOtherShard || recoveryModule.localKeyshareExist
          ) && (
            <Form.Item
              label="Wallet name"
              name="walletName"
              rules={[
                { required: true, message: 'Please enter the wallet name.' },
              ]}>
              <Input />
            </Form.Item>
          )}

          <Form.Item
            label="Mnemonic phrase for private key shard A"
            name="mnemonic"
            rules={[
              {
                async validator(rule, value) {
                  if (!value) {
                    return Promise.reject('Please paste the mnemonic phrase')
                  }
                  if (!mnemonicValidator(value)) {
                    return Promise.reject(
                      'The mnemonic phrase is incorrect. Please check and try again.'
                    )
                  }
                  return Promise.resolve()
                },
              },
            ]}>
            <Input.TextArea
              rows={6}
              placeholder="Please enter 24 words separted by spaces"
            />
          </Form.Item>
          <div className={styles.skip}>
            The mnemonic phrase is lost. <a onClick={handleSkip}>Skip it</a>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Continue
            </Button>
          </Form.Item>
        </Form>
      ) : recoveryModule.mnemonicFormType === 'done' ? (
        <div className={styles.done}>
          <p>
            Please follow the prompts in the Safeheron Snap App on each phone,
            and tap 'Continue' in the mobile app after completing the operation.
          </p>
          <img src={waiting} width={168} />
        </div>
      ) : (
        <div className={`${styles.done} ${styles.noNeed}`}>
          <p>
            Your three private key shards A, B, and C are all functioning well
            and do not need to be recovered.
          </p>
          <img src={noNeed} width={245} />
        </div>
      )}
    </>
  )
}

export default observer(MnemonicForm)
