import { Loading3QuartersOutlined } from '@ant-design/icons'
import { FC } from 'react'

import styles from '@/styles/components/Loading.module.less'
interface Props {
  loading: boolean
  text?: string
}

const Loading: FC<Props> = ({ loading, text }) => {
  if (!loading) {
    return null
  }
  return (
    <div className={styles.loading}>
      <span>{text}</span>
      <Loading3QuartersOutlined style={{ fontSize: 42, color: 'white' }} spin />
    </div>
  )
}

export default Loading
