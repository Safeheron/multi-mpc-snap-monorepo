import styles from '@/styles/components/InstallReminder.module.less'
const flaskLinkUrl = 'https://metamask.io/flask/'
const appDownload = ''

import arrow from '@/assets/arrow.png'

const InstallReminder = () => {
  return (
    <div className={styles.reminder}>
      <p>
        Please make sure that you've installed MetaMask Flask on your Google
        Chrome and Safeheron Snap App on your two different mobile phones.
      </p>
      <div className={styles.btns}>
        <a className={styles.link} target="'_blank'" href={flaskLinkUrl}>
          <span>Download MetaMask Flask</span>
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
