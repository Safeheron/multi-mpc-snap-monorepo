import styles from '@/styles/components/InstallReminder.module.less'

const appDownload = ''

import arrow from '@/assets/arrow.png'
import { METAMASK_EXTENSION_URL } from '@/configs/Configs'

const InstallReminder = () => {
  return (
    <div className={styles.reminder}>
      <p>
        Please ensure you've installed MetaMask on your Google Chrome and
        Safeheron Snap App on your two mobile phones.
      </p>
      <div className={styles.btns}>
        <a
          className={styles.link}
          target="'_blank'"
          href={METAMASK_EXTENSION_URL}>
          <span>Download MetaMask</span>
          <img src={arrow} />
        </a>
        <a className={styles.link} target="'_blank'" href={appDownload}>
          <span>Install Safeheron Snap App</span>
          <img src={arrow} />
        </a>
      </div>
    </div>
  )
}

export default InstallReminder
