import { Input } from 'antd'
import classNames from 'classnames'
import { FC } from 'react'

import copy from '@/assets/copy.png'
import styles from '@/styles/components/MnemonicList.module.less'
import { copyText } from '@/utils'

interface Props {
  list: string[]
  onChange?: (e, index) => void
  copyable?: boolean
  errorList?: number[]
}

const MnemonicList: FC<Props> = ({ list, onChange, copyable, errorList }) => {
  const handleChange = (e, i) => {
    onChange && onChange(e, i)
  }

  return (
    <ul className={styles.mnemonicList}>
      {list.map((v, i) => {
        const isInput = !v
        return (
          <li
            key={i}
            className={classNames({
              [styles.isInput]: isInput,
              [styles.error]: errorList?.includes(i),
            })}>
            <b>{i + 1}</b>
            {isInput ? (
              <Input onChange={e => handleChange(e, i)} />
            ) : (
              <span>{v}</span>
            )}
          </li>
        )
      })}
      {copyable && (
        <a
          className={styles.copy}
          onClick={() =>
            copyText(`Key shard A: ${list.join(' ')}`, 'Mnemonic')
          }>
          <img src={copy} />
          Copy
        </a>
      )}
    </ul>
  )
}

export default MnemonicList
