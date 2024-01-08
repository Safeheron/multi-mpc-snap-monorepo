import { EthMethod } from '@metamask/keyring-api'
import { TransactionObject } from '@safeheron/mpcsnap-types'
import { Button, Form, Input } from 'antd'
import { parseEther } from 'ethers/lib/utils'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { useStore } from '@/store'
import styles from '@/styles/containers/SendDialog.module.less'
import { ethers, getProvider, wei2eth } from '@/utils'

const ConfirmForm = () => {
  const {
    interactive,
    accountModule,
    transactionModule,
    signModule,
    networkModule,
  } = useStore()
  const { feeData, fee, baseTx } = transactionModule
  const { intChainId, chainName, currentChain, hexChainId } = networkModule

  const currentSymbol = currentChain?.nativeCurrency.symbol

  useEffect(() => {}, [])

  const handleConfirm = async () => {
    const provider = getProvider()

    try {
      interactive.setLoading(true)
      const defaultNonce = await provider.getTransactionCount(
        accountModule.address
      )

      const chainId = (await provider.getNetwork()).chainId
      const txObj: TransactionObject = {
        nonce: String(defaultNonce || 0),
        to: baseTx.to,
        chainId: String(chainId),
        data: baseTx.data,
        value: parseEther(baseTx.value).toString(),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: feeData.gasLimit,
        type: 2,
      }

      transactionModule.setTransactionObject(txObj)

      const res = await signModule.requestSignApproval({
        method: EthMethod.SignTransaction,
        params: txObj,
        createTime: Date.now(),
        chainId: hexChainId,
      })

      interactive.setLoading(false)

      if (res.success) {
        transactionModule.setSendDialogVisible(false)
        interactive.setProgress(0)
      } else {
        // no op
      }
    } catch (error) {
      console.error('Confirm transaction error: ', error)
      interactive.setLoading(false)
    }
  }

  const handleBack = () => transactionModule.setSendFormCompleted(false)

  return (
    <div className={styles.confirmDialog}>
      <h1>Confirm</h1>
      <div className={styles.amount}>
        <strong>{baseTx.value}</strong>
        <span>{currentSymbol}</span>
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
            <span>{chainName || intChainId}</span>
          </div>
          <div className={styles.infoItem}>
            <span>Network Fee</span>
            <span>
              {wei2eth(fee)} {currentSymbol}{' '}
              <small>
                (
                {ethers.utils.formatUnits(
                  feeData.maxFeePerGas || feeData.gasPrice || '0',
                  'gwei'
                )}{' '}
                Gwei)
              </small>
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
