import { Table } from 'antd'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { useStore } from '@/store'
import styles from '@/styles/containers/TransactionList.module.less'
import { ellipsisAddress, wei2eth } from '@/utils'
dayjs.extend(utc)

const TransactionList = () => {
  const { accountModule, transactionModule } = useStore()
  const { transactionList } = transactionModule

  useEffect(() => {
    transactionModule.getTransactionList()
  }, [])

  const columns = [
    {
      title: 'Txn Hash',
      dataIndex: 'txHash',
      render: data => (
        <a href={`${accountModule.network.explorer}/tx/${data}`} target="_blank">
          {ellipsisAddress(data)}
        </a>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'method',
    },
    {
      title: 'From',
      dataIndex: 'from',
      render: data => (
        <a
          href={`${accountModule.network.explorer}/address/${data}`}
          target="_blank">
          {ellipsisAddress(data)}
        </a>
      ),
    },
    {
      title: 'To',
      dataIndex: 'to',
      render: data => (
        <a
          href={`${accountModule.network.explorer}/address/${data}`}
          target="_blank">
          {ellipsisAddress(data)}
        </a>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: data => <span>{data} ETH</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: data => <span className={data}>{data}</span>,
    },
    {
      title: 'Date Time (UTC)',
      dataIndex: 'date',
      render: data => dayjs(data).utc().format('YYYY.MM.DD HH:mm:ss'),
    },
  ]
  return (
    <div className={styles.record}>
      <Table
        rowKey="txHash"
        dataSource={transactionList}
        columns={columns}
        pagination={false}
      />
      {transactionList.length >= 30 && (
        <div
          className={styles.more}
          onClick={() =>
            window.open(
              `${accountModule.network.explorer}/address/${accountModule.address}`
            )
          }>
          <ul>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default observer(TransactionList)
