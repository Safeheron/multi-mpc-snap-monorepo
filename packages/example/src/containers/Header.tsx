import { observer } from 'mobx-react-lite'
import { FC, PropsWithChildren, useEffect, useState } from 'react'

import logo from '@/assets/logo.png'
import styles from '@/styles/containers/Header.module.less'

const Header: FC<PropsWithChildren> = ({ children }) => {
  const [percent, setPercent] = useState(0)
  useEffect(() => {
    onScroll()
    window.addEventListener('scroll', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const onScroll = () => {
    if (percent > 100) return
    setPercent(document.documentElement.scrollTop)
  }

  return (
    <div
      className={styles.header}
      style={{ backgroundColor: `rgba(255,255,255,${percent / 10})` }}>
      <div className={styles.container}>
        <div className={styles.logoBox}>
          <div>
            <img src={logo} width={42} alt={'Safeheron Logo'} />
          </div>
          <div className={styles.text}>
            <div className={styles.title}>Safeheron Snap</div>
            <div className={styles.desc}>An MPC wallet for MetaMask users</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default observer(Header)
