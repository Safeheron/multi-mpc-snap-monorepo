import { Button, Form, Input } from 'antd'
import { formatUnits } from 'ethers/lib/utils'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { signApproval } from '@/service/metamask'
import MessageRelayer from '@/service/relayer/MessageRelayer'
import { useStore } from '@/store'
import styles from '@/styles/containers/SendDialog.module.less'
import { ethers, provider, wei2eth } from '@/utils'

const ConfirmForm = () => {
  const { interactive, accountModule, messageModule, transactionModule } =
    useStore()
  const { feeData, fee, baseTx } = transactionModule

  useEffect(() => {}, [])

  const handleConfirm = async () => {
    if (!provider) return

    try {
      interactive.setLoading(true)
      const defaultNonce = await provider.getTransactionCount(
        accountModule.address
      )

      const chainId = (await provider.getNetwork()).chainId
      const txObj = {
        nonce: defaultNonce || 0,
        to: baseTx.to,
        value: baseTx.value,
        data: baseTx.data,
        chainId,
        maxFeePerGas: formatUnits(feeData.maxFeePerGas, 'gwei').toString(),
        maxPriorityFeePerGas: formatUnits(
          feeData.maxPriorityFeePerGas,
          'gwei'
        ).toString(),
        gasLimit: feeData.gasLimit,
      }
      transactionModule.setTransactionObject(txObj)
      const res = await signApproval(txObj)
      interactive.setLoading(false)
      console.log(res)

      if (res.success) {
        interactive.setSessionId(res.data)
        const messageRelayer = new MessageRelayer(2)
        messageModule.setMessageRelayer(messageRelayer)
        interactive.setSendDialogVisible(false)
        interactive.setProgress(0)
        interactive.setSignStep(1)
        interactive.setSignTransactionDialogVisible(true)
      }
    } catch (error) {
      interactive.setLoading(false)
    }
  }

  const handleBack = () => {
    interactive.setSendFormCompleted(false)
  }

  return (
    <div className={styles.confirmDialog}>
      <h1>Confirm</h1>
      <div className={styles.amount}>
        <strong>{baseTx.value}</strong>
        <span>ETH</span>
      </div>
      <Form
        className={styles.confirmForm}
        layout="vertical"
        requiredMark={false}>
        <Form.Item
          label="From"
          rules={[
            { required: true, message: 'Please paste the receive address!' },
          ]}>
          <Input
            value={`${accountModule.walletName}(${accountModule.address})`}
            disabled
          />
        </Form.Item>
        <Form.Item
          label="To"
          rules={[
            { required: true, message: 'Please paste the receive address!' },
          ]}>
          <Input value={baseTx.to} disabled />
        </Form.Item>
        {!baseTx.data ? null : (
          <Form.Item
            label="Hex Data"
            rules={[
              { required: true, message: 'Please paste the receive address!' },
            ]}>
            <Input value={baseTx.data} disabled />
          </Form.Item>
        )}

        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span>Network</span>
            <span>{accountModule.network.name}</span>
          </div>
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
              <Button onClick={handleBack}>Back</Button>
              <Button onClick={handleConfirm} type="primary">
                Confirm
              </Button>
            </div>
          )}
        </Form.Item>
      </Form>
    </div>
  )
}

export default observer(ConfirmForm)
