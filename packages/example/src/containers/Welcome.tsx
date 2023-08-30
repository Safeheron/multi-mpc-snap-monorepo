import { useContext } from 'react'

import welcome from '@/assets/welcome.png'
import InstallReminder from '@/components/InstallReminder'
import { snap_origin } from '@/configs/snap'
import { MetaMaskContext } from '@/hooks/MetamaskContext'
import styles from '@/styles/containers/Welcome.module.less'
import { isLocalSnap } from '@/utils/snap'

const Welcome = () => {
  const [state] = useContext(MetaMaskContext)
  const isMetaMaskReady = isLocalSnap(snap_origin)
    ? state.isFlask
    : state.snapsDetected

  return (
    <div className={styles.welcome}>
      <InstallReminder />
      <div className={styles.imgBox}>
        <img src={welcome} width="869" />
      </div>
      {!isMetaMaskReady && <div></div>}
    </div>
  )
}

export default Welcome
