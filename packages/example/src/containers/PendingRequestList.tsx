import { InfoCircleOutlined } from '@ant-design/icons'
import { EthMethod, KeyringRequest } from '@metamask/keyring-api'
import { WrappedKeyringRequest } from '@safeheron/mpcsnap-types'
import { Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'

import emptyPng from '@/assets/empty.png'
import useAsyncInterval from '@/hooks/useAsyncInterval'
import useConfirm from '@/hooks/useConfirm'
import { keyringRejectRequestId, listKeyringRequests } from '@/service/metamask'
import { useStore } from '@/store'
import styles from '@/styles/containers/TransactionList.module.less'
import { formatToUSDateTime } from '@/utils/dateUtil'
import {
  convertRequestTitle,
  tryToExtractChainId,
} from '@/utils/snapRequestUtil'

const LOOP_GAP = 5_000

const PendingRequestList: React.FC = () => {
  const { signModule, networkModule, accountModule } = useStore()
  const { address, backuped } = accountModule

  const [requests, setRequests] = useState<WrappedKeyringRequest[]>([])

  const getSnapRequests = async () => {
    const r = await listKeyringRequests()
    if (r.success) {
      setRequests(r.data)
    } else {
      // TODO show rpc error
    }
  }
  const { pause, resume } = useAsyncInterval(getSnapRequests, LOOP_GAP, true)

  const resolveRequest = async (
    rpcRequest: KeyringRequest['request'],
    time: number,
    requestId: string
  ) => {
    const { method: requestMethod, params } = rpcRequest

    let originalParams
    switch (requestMethod) {
      case EthMethod.PersonalSign: {
        const [message, _] = params as [string, string]
        originalParams = message
        break
      }
      case EthMethod.Sign:
      case EthMethod.SignTypedDataV1:
      case EthMethod.SignTypedDataV3:
      case EthMethod.SignTypedDataV4:
        const [_, data] = params as [string, any]
        originalParams = data
        break
      case EthMethod.SignTransaction:
        const [tx] = params as [any]
        originalParams = {
          ...tx,
          type: parseInt(tx.type, 16),
        }
        break
      default:
        throw new Error('Unknown request method: ' + requestMethod)
    }
    const ret = await signModule.requestSignApproval(
      {
        method: requestMethod,
        params: originalParams,
        createTime: time,
        chainId: tryToExtractChainId(requestMethod, params),
      },
      requestId
    )
    if (!ret.success) {
      // empty op
    }
  }

  const { showConfirm } = useConfirm()
  const rejectRequest = async (requestId: string) => {
    showConfirm({
      content: 'Confirm rejection of signature?',
      onOk: async () => {
        try {
          await keyringRejectRequestId(requestId)
          await getSnapRequests()
        } catch (e) {
          /* log error */
        }
      },
    })
  }

  const columns: ColumnsType<WrappedKeyringRequest> = [
    {
      title: 'Date Time (UTC)',
      render: (_, record) => {
        return <span>{formatToUSDateTime(record.createTime)}</span>
      },
    },
    {
      title: 'Action',
      render: (_, record) => {
        return (
          <div>
            <p style={{ fontWeight: 'bold' }}>
              {convertRequestTitle(record.request.request)}
            </p>
          </div>
        )
      },
    },
    {
      title: 'Network',
      align: 'right',
      render: (_, record) => {
        const paramsJson = toJS(record.request.request)
        // @ts-ignore
        const { method, params } = paramsJson
        const chainId = tryToExtractChainId(method as EthMethod, params)
        return <span>{networkModule.getChainName(chainId) || '--'}</span>
      },
    },
    {
      title: ' ',
      align: 'right',
      render: (_, record) => (
        <Space>
          <a
            onClick={() =>
              resolveRequest(
                toJS(record.request.request),
                record.createTime,
                record.request.id
              )
            }>
            MPC Sign
          </a>
          <a
            onClick={() => rejectRequest(record.request.id)}
            style={{ marginLeft: 20 }}>
            Reject
          </a>
        </Space>
      ),
    },
  ]

  useEffect(() => {
    if (address && backuped) {
      resume()
    } else {
      pause()
    }
  }, [address, backuped])

  return (
    <div className={styles.container}>
      <div className={styles.title}>Your Safeheron Snap is ready to use.</div>
      <div className={styles.subTitle}>
        Any pending signature requests will appear below.
      </div>
      <div className={styles.riskText}>
        <InfoCircleOutlined style={{ marginRight: '6px' }} />
        Pose potential security risks when interacting with specific dApps which
        using signature-derived keys.{' '}
        <a
          href="https://blog.safeheron.com/blog/insights/safeheron-originals/enhancing-security-on-mpc-wallet-dydx-connections"
          target={'_blank'}>
          Learn more.
        </a>
      </div>
      <div className={styles.record}>
        {requests.length > 0 ? (
          <Table
            rowKey={row => row['request'].id}
            dataSource={requests}
            columns={columns}
            pagination={false}
          />
        ) : (
          <div className={styles.emptyContainer}>
            <img src={emptyPng} width={80} alt={''} />

            <div>Use Safeheron Snap in MetaMask</div>

            <div className={styles.emptyTipList}>
              <div>
                1. Select the Safeheron Snap account in the MetaMask Extension.
              </div>
              <div>
                2. Submit the signature request in the MetaMask Extension.
              </div>
              <div>
                3. Process the signature request on the Safeheron Snap website.
              </div>
              <div>
                4. Follow the instructions to complete the MPC Sign in the
                Safeheron Snap App
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default observer(PendingRequestList)
