import { observer } from 'mobx-react-lite'
import { FC, PropsWithChildren } from 'react'

import logo from '@/assets/logo.png'
import styles from '@/styles/containers/Header.module.less'

const Header: FC<PropsWithChildren> = ({ children }) => {
  const toIndex = () => {
    window.open(location.origin)
  }

  return (
    <div className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoBox} onClick={toIndex}>
          <div>
            <img src={logo} width={42} alt={'Safeheron Logo'} />
          </div>
          <div className={styles.text}>
            <div className={styles.title}>Safeheron Snap</div>
            <div className={styles.desc}>
              Enables MPC Wallet inside MetaMask
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default observer(Header)
