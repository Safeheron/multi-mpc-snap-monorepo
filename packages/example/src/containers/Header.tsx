import { observer } from 'mobx-react-lite'
import { FC, PropsWithChildren } from 'react'

import logo from '@/assets/logo.png'
import { useStore } from '@/store'
import styles from '@/styles/containers/Header.module.less'

interface HeaderProps extends PropsWithChildren {
  hideNetwork?: boolean
}

const Header: FC<HeaderProps> = ({ hideNetwork, children }) => {
  const { networkModule } = useStore()
  const { hexChainId, chainName, fetchChainListFailed } = networkModule

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
            <div className={styles.desc}>Enable MPC Wallet within MetaMask</div>
          </div>
        </div>
        {hideNetwork ? (
          <div></div>
        ) : (
          <div className={styles.network}>
            {fetchChainListFailed && (
              <span>ChainId: {parseInt(hexChainId)}</span>
            )}
            {chainName && <span>{chainName}</span>}
          </div>
        )}
        <div className={styles.rightContent}>{children}</div>
      </div>
    </div>
  )
}

export default observer(Header)
