import { KeyringRequest } from '@metamask/keyring-api'
import { Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'

import useAsyncInterval from '@/hooks/useAsyncInterval'
import useConfirm from '@/hooks/useConfirm'
import {
  keyringRejectRequestId,
  listKeyringRequests,
  signApproval,
} from '@/service/metamask'
import MessageRelayer from '@/service/relayer/MessageRelayer'
import { useStore } from '@/store'
import styles from '@/styles/containers/TransactionList.module.less'
import { tryToExtractChainId } from '@/utils/snapRequestUtil'

function convertRequestTitle(rpcRequest: KeyringRequest['request']) {
  let title = ''
  switch (rpcRequest.method) {
    case 'eth_signTransaction':
    case 'eth_sendTransaction':
      title = 'Send Transaction'
      break
    case 'eth_sign':
    case 'personal_sign':
      title = 'Request for signature'
      break
    case 'eth_signTypedData':
      // @ts-ignore
      const version = rpcRequest.params[2] as { version: string }
      if (version && ['v3', 'v4'].includes(version.version.toLowerCase())) {
        // @ts-ignore
        const params = rpcRequest.params[1] as Record<string, any>
        title = params.domain.name
      } else {
        title = 'Request for signature'
      }
      break
    default:
      title = 'Unsupported Request Type'
  }
  return title
}

const LOOP_GAP = 5_000

const PendingRequestList: React.FC = () => {
  const {
    signModule,
    interactive,
    messageModule,
    networkModule,
    accountModule,
  } = useStore()
  const { address, backuped } = accountModule

  const [requests, setRequests] = useState<KeyringRequest[]>([])

  const getSnapRequests = async () => {
    console.debug('Start to loop request...')
    const r = await listKeyringRequests()
    setRequests(r)
  }
  const { pause, resume } = useAsyncInterval(getSnapRequests, LOOP_GAP)

  const resolveRequest = async (rpcRequest: KeyringRequest['request']) => {
    let requestMethod = rpcRequest.method
    // @ts-ignore
    const originParams = rpcRequest.params[1]

    if (requestMethod === 'eth_signTypedData') {
      // @ts-ignore
      const version = rpcRequest.params[2] as { version: string }
      if (version && version.version) {
        requestMethod = 'eth_signTypedData_' + version.version.toLowerCase()
      }
    }

    signModule.setPendingRequest({
      originalMethod: rpcRequest.method,
      // @ts-ignore
      method: requestMethod,
      // @ts-ignore
      params: originParams,
    })

    // approval send transaction
    const ret = await signApproval(
      // @ts-ignore
      requestMethod,
      // @ts-ignore
      originParams,
      rpcRequest.id
    )

    if (ret.success) {
      interactive.setSessionId(ret.data)

      // setup message channel
      const messageRelayer = new MessageRelayer(2)
      messageModule.setMessageRelayer(messageRelayer)
      interactive.setSignStep(1)
      // open dialog
      interactive.setSignTransactionDialogVisible(true)
    }
  }

  const { showConfirm } = useConfirm()
  const rejectRequest = async (requestId: string) => {
    showConfirm({
      content: 'Confirm rejection of signature?',
      onOk: async () => {
        await keyringRejectRequestId(requestId)
        await getSnapRequests()
      },
    })
  }

  const columns: ColumnsType<KeyringRequest> = [
    {
      title: 'Date Time (UTC)',
      render: (_, record) => {
        // @ts-ignore
        return <span>---</span>
      },
    },
    {
      title: 'Action',
      render: (text, record) => {
        return (
          <div>
            <p style={{ fontWeight: 'bold' }}>
              {record.request.method}: {convertRequestTitle(record.request)}
            </p>
          </div>
        )
      },
    },
    {
      title: 'Network',
      align: 'right',
      render: (_, record) => {
        const paramsJson = toJS(record.request)
        // @ts-ignore
        const { method, params } = paramsJson
        const chainId = tryToExtractChainId(
          // @ts-ignore
          method,
          Array.isArray(params) ? params[1] : {}
        )
        return <span>{networkModule.getChainName(chainId) || '--'}</span>
      },
    },
    {
      title: ' ',
      align: 'right',
      render: (_, record) => (
        <Space>
          <a onClick={() => resolveRequest(toJS(record.request))}>MPC Sign</a>
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
      <div className={styles.title}>Waiting for signature</div>
      <div className={styles.subTitle}>
        You need to process the signature request for this wallet by submitting
        it on MetaMask
      </div>
      <div className={styles.record}>
        <Table
          rowKey={row => row['request'].id}
          dataSource={requests}
          columns={columns}
          pagination={false}
        />
      </div>
    </div>
  )
}

export default observer(PendingRequestList)
