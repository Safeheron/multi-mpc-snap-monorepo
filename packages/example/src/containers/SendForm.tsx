import { Button, Form, Input, Space } from 'antd'
import { isAddress } from 'ethers/lib/utils'
import { debounce } from 'lodash'
import { observer } from 'mobx-react-lite'
import { ChangeEvent, useEffect, useState } from 'react'

import NumberInput from '@/components/NumberInput'
import { useStore } from '@/store'
import styles from '@/styles/containers/SendDialog.module.less'
import { ethers, wei2eth } from '@/utils'

const SendForm = () => {
  const { interactive, accountModule, transactionModule } = useStore()
  const { baseTx, feeData, fee, availableBalance } = transactionModule

  const [form] = Form.useForm()
  const [, forceUpdate] = useState({})

  useEffect(() => {
    transactionModule.getFeeData()
    console.log({ ...baseTx })

    forceUpdate({})
  }, [])

  const onFinish = async values => {
    transactionModule.setBaseTx(values)
    interactive.setSendFormCompleted(true)
  }
  const handleCancel = async () => {
    form.resetFields()
    transactionModule.setBaseTx({})
    interactive.setSendDialogVisible(false)
  }

  const handleMax = () => {
    form.setFieldValue('value', wei2eth(availableBalance))
    form.validateFields(['value'])
  }

  const handleDataChange = debounce((e: ChangeEvent<HTMLInputElement>) => {
    dataChangeAction(e.target.value)
  }, 300)

  const dataChangeAction = async data => {
    const to = form.getFieldValue('to')
    const value = form.getFieldValue('value')
    if (
      !to ||
      !value ||
      form.getFieldsError().filter(({ errors }) => errors.length).length > 0
    ) {
      return
    }

    transactionModule.setBaseTx({
      to,
      value,
      data,
    })
    await transactionModule.getFeeData()
    form.validateFields(['value'])
  }

  return (
    <div className={styles.sendDialog}>
      <h1>Send</h1>
      <Form
        form={form}
        className={styles.sendForm}
        onFinish={onFinish}
        layout="vertical"
        // initialValues={{
        //   to: '0x324a1c5f646F5aA117afCa9e8cC9fe74547f822e',
        //   value: '0',
        // }}
        requiredMark={false}>
        <Form.Item
          label="To"
          name="to"
          initialValue={baseTx.to}
          rules={[
            {
              async validator(rule, value) {
                if (!value) {
                  return Promise.reject('Please enter the receiving address')
                }
                if (!isAddress(value)) {
                  return Promise.reject(
                    'The address should be formatted correctly'
                  )
                }
                return Promise.resolve()
              },
            },
          ]}>
          <Input maxLength={42} placeholder="Paste the receiving address" />
        </Form.Item>

        <Space style={{ position: 'relative', display: 'block' }}>
          <Form.Item
            label="Amount"
            name="value"
            initialValue={baseTx.value || ''}
            rules={[
              {
                async validator(rule, value) {
                  if (!value) {
                    return Promise.reject('Please enter the amount')
                  }
                  if (value > wei2eth(availableBalance)) {
                    return Promise.reject('Insufficient balance')
                  }
                  return Promise.resolve()
                },
              },
            ]}>
            <NumberInput placeholder="Enter the amount" />
          </Form.Item>
          <div className={styles.formAmount}>
            Available Balance: {wei2eth(availableBalance)} ETH
            <a onClick={handleMax}>Max</a>
          </div>
        </Space>

        <Form.Item
          label="Hex Data"
          name="data"
          initialValue={baseTx.data || ''}>
          <Input placeholder="Optional" onChange={handleDataChange} />
        </Form.Item>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span>Network Fee</span>
            <span>
              {wei2eth(fee)} ETH{' '}
              <small>({ethers.utils.formatUnits(fee, 'gwei')}Gwei)</small>
            </span>
          </div>
        </div>

        <Form.Item style={{ marginTop: 67 }} shouldUpdate>
          {() => (
            <div className="btn-control">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                disabled={
                  !form.getFieldValue('to') || !form.getFieldValue('value')
                }>
                Continue
              </Button>
            </div>
          )}
        </Form.Item>
      </Form>
    </div>
  )
}

export default observer(SendForm)
