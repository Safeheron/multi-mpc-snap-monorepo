import { useEffect, useState } from 'react'

import welcome from '@/assets/welcome.png'
import InstallReminder from '@/components/InstallReminder'
import styles from '@/styles/containers/Welcome.module.less'
import { isMetaMaskSnapsSupported } from '@/utils'

const Welcome = () => {
  const [flaskIsInstall, setFlaskIsInstall] = useState(true)

  const detectFlask = async () => {
    const supportSnap = await isMetaMaskSnapsSupported()
    setFlaskIsInstall(supportSnap)
  }

  useEffect(() => {
    detectFlask()
  }, [])

  return (
    <div className={styles.welcome}>
      <InstallReminder />
      <div className={styles.imgBox}>
        <img src={welcome} width="869" />
      </div>
      {!flaskIsInstall && <div></div>}
    </div>
  )
}

export default Welcome
