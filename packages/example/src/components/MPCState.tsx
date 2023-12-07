import { FC } from 'react'

import data from '@/assets/loading.json'
import success from '@/assets/success.png'
import styles from '@/styles/components/MPCState.module.less'

import Lottie from './Lottie'

interface Props {
  loading?: boolean
  number?: number
  text?: string
}

const MpcState: FC<Props> = ({ loading, number, text }) => {
  return (
    <div className={styles.mpcState}>
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.percent}>
            <i>{number}%</i>
          </div>
          <Lottie data={data} />
          <p>{text}</p>
        </div>
      ) : (
        <div className={styles.success}>
          <img src={success} width={100} />
          <span>Success</span>
        </div>
      )}
    </div>
  )
}

export default MpcState
