import { Button, Form, Input, Space } from 'antd'
import { isAddress } from 'ethers/lib/utils'
import { debounce } from 'lodash'
import { observer } from 'mobx-react-lite'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'

import NumberInput from '@/components/NumberInput'
import { useStore } from '@/store'
import styles from '@/styles/containers/SendDialog.module.less'
import { ethers, wei2eth } from '@/utils'

const SendForm = () => {
  const { interactive, transactionModule, networkModule } = useStore()
  const { baseTx, fee, feeData, availableBalance } = transactionModule
  const { currentChain } = networkModule
  const currentSymbol = currentChain?.nativeCurrency.symbol

  const [form] = Form.useForm()
  const [, forceUpdate] = useState({})
  const [submittable, setSubmittable] = useState(false)
  const values = Form.useWatch([], form)

  useEffect(() => {
    form
      // @ts-ignore
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false))
  }, [values])

  const onFinish = async (v: any) => {
    transactionModule.setBaseTx(v)
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
    const fieldHasError =
      form.getFieldsError().filter(({ errors }) => errors.length).length > 0
    if (!to || !value || fieldHasError) {
      return
    }

    transactionModule.setBaseTx({ to, value, data })
    await transactionModule.getFeeData()
    await form.validateFields(['value'])
  }

  useEffect(() => {
    transactionModule.getFeeData()
    console.log({ ...baseTx })

    forceUpdate({})
  }, [])

  return (
    <div className={styles.sendDialog}>
      <h1>Send</h1>
      <Form
        form={form}
        className={styles.sendForm}
        onFinish={onFinish}
        layout="vertical"
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
                  return Promise.reject('Invalid Address')
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
                  if (
                    ethers.BigNumber.from(value).isZero() ||
                    value > wei2eth(availableBalance)
                  ) {
                    return Promise.reject('Insufficient balance')
                  }
                  return Promise.resolve()
                },
              },
            ]}>
            <NumberInput placeholder="Enter the amount" />
          </Form.Item>
          <div className={styles.formAmount}>
            Available Balance: {wei2eth(availableBalance)} {currentSymbol}
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
              {wei2eth(fee)} {currentSymbol}
              <small>
                (
                {ethers.utils.formatUnits(
                  feeData.maxFeePerGas || feeData.gasPrice || '0',
                  'gwei'
                )}
                Gwei)
              </small>
            </span>
          </div>
        </div>

        <Form.Item style={{ marginTop: 67 }} shouldUpdate>
          {() => (
            <div className="btn-control">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" disabled={!submittable}>
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
