import { Button, Form, Input } from 'antd'
import { observer } from 'mobx-react-lite'

import noNeed from '@/assets/no-need.png'
import waiting from '@/assets/waiting.png'
import useConfirm from '@/hooks/useConfirm'
import { PartyId } from '@/service/types'
import { MPCMessageType } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/MnemonicForm.module.less'
import { mnemonicValidator } from '@/utils/validator'

const MnemonicForm = () => {
  const [form] = Form.useForm()
  const { interactive, messageModule } = useStore()
  const { showConfirm, showInfo } = useConfirm()
  const handleSkip = async () => {
    if (interactive.isSkip) {
      showInfo({
        content:
          'At least 2 private key shards are required to recover the wallet. If other devices have skipped entering the mnemonic phrase, this device cannot skip. Please enter the mnemonic phrase for this device.',
      })
    } else {
      try {
        if (!interactive.hasOtherShard) {
          await form.validateFields(['walletName'])
        }
        showConfirm({
          content:
            'The wallet address will remain the same, but you will need to back up the recovered private key shard before you can use the wallet.',
          onOk() {
            const walletName = form.getFieldValue('walletName')

            console.log(walletName)
            interactive.setMnemonic('')
            interactive.setWalletName(walletName)

            messageModule.rpcChannel?.next({
              sendType: 'broadcast',
              messageType: MPCMessageType.mnemonicSkip,
              messageContent: null,
            })
            messageModule.rpcChannel?.next({
              messageType: MPCMessageType.mnemonicReady,
              messageContent: {
                walletName,
                hasMnemonic: false,
                partyId: PartyId.A,
              },
            })

            interactive.setMnemonicFormType('done')
          },
        })
      } catch (error) {}
    }
  }
  const onFinish = values => {
    interactive.setWalletName(values.walletName)
    interactive.setMnemonic(values.mnemonic)
    interactive.setMnemonicFormType('done')
    messageModule.rpcChannel?.next({
      messageType: MPCMessageType.mnemonicReady,
      messageContent: {
        walletName: values.walletName,
        hasMnemonic: true,
        partyId: PartyId.A,
      },
    })
  }

  return (
    <>
      {interactive.mnemonicFormType === 'init' ? (
        <Form
          form={form}
          name="mnemonicForm"
          className={styles.mnemonicForm}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}>
          {!interactive.hasOtherShard && (
            <Form.Item
              label="Wallet name"
              name="walletName"
              rules={[
                { required: true, message: 'Please enter the wallet name' },
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
            <Input.TextArea rows={6} />
          </Form.Item>
          <div className={styles.skip}>
            Mnemonic phrase lost, <a onClick={handleSkip}>skipping input</a>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Continue
            </Button>
          </Form.Item>
        </Form>
      ) : interactive.mnemonicFormType === 'done' ? (
        <div className={styles.done}>
          <p>
            Please follow the prompts in the Safeheron Snap App on both phones
            separately, and click 'Continue' in the mobile app after completing
            the operation.
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
