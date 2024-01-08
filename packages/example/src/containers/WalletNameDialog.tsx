import { OperationType, PartyReadyMessage } from '@safeheron/mpcsnap-types'
import { Button, Checkbox, Form, Input, Modal } from 'antd'
import { useEffect, useState } from 'react'

import { RPCChannel } from '@/service/channel/RPCChannel'
import { createApproval } from '@/service/metamask'
import MessageRelayer from '@/service/relayer/MessageRelayer'
import { PartyId } from '@/service/types'
import { PartyIndexMap } from '@/service/types'
import { useStore } from '@/store'
import styles from '@/styles/containers/WalletNameDialog.module.less'

const WalletNameDialog = () => {
  const { interactive, keygenModule } = useStore()

  const [form] = Form.useForm()
  const [, forceUpdate] = useState({})

  useEffect(() => forceUpdate({}), [])

  const handleCancel = () => {
    keygenModule.setWalletNameDialogVisible(false)
  }

  const onFinish = async values => {
    keygenModule.setWalletName(values.name)
    handleCancel()

    const party = {
      party_id: PartyId.A,
      index: PartyIndexMap[PartyId.A],
    }

    interactive.setLoading(true)
    const res = await createApproval(values.name, party)
    interactive.setLoading(false)

    if (res.success) {
      keygenModule.setSessionId(res.data.sessionId)

      const rpcChannel = new RPCChannel()
      keygenModule.setRPCChannel(rpcChannel)

      const messageRelayer = new MessageRelayer(3)
      keygenModule.setMessageRelayer(messageRelayer)

      messageRelayer.join(rpcChannel)

      const partyReadyMessage: PartyReadyMessage = {
        messageType: OperationType.partyReady,
        messageContent: { ...party, pub: res.data.pub },
      }

      rpcChannel.next(partyReadyMessage)

      interactive.setProgress(5)

      keygenModule.setCreateStep(1)
      keygenModule.setCreateDialogVisible(true)
    }
  }

  return (
    <Modal centered closable={false} open={true} footer={null} width={735}>
      <div className={styles.walletName}>
        <h1>Wallet Name</h1>
        <Form
          name="nameForm"
          form={form}
          className={styles.nameForm}
          onFinish={onFinish}>
          <Form.Item
            name="name"
            rules={[
              {
                async validator(rule, value) {
                  if (!value) {
                    return Promise.reject('Please enter the wallet name.')
                  }
                  if (value.replace(/[^\x00-\xff]/g, 'aa').length > 60) {
                    return Promise.reject('Within 60 characters')
                  }
                  return Promise.resolve()
                },
              },
            ]}>
            <Input placeholder="Up to 60 Characters" />
          </Form.Item>

          <Form.Item
            name="agree"
            valuePropName="checked"
            style={{ textAlign: 'left' }}
            rules={[
              {
                validator: (rule, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        'Please check and the User and Privacy Agreement.'
                      ),
              },
            ]}>
            <Checkbox>
              I agree to the{' '}
              <a href="/agreement" target={'_blank'}>
                User and Privacy Agreement
              </a>
              .
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginTop: 67 }} shouldUpdate>
            {() => (
              <div className="btn-control">
                <Button onClick={handleCancel}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !form.getFieldValue('name') || !form.getFieldValue('agree')
                  }>
                  Continue
                </Button>
              </div>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default WalletNameDialog
