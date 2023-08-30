import styles from '@/styles/components/InstallReminder.module.less'

// TODO change below url when released
const flaskLinkUrl = 'https://metamask.io/flask/'
const appDownload = ''

import arrow from '@/assets/arrow.png'

const InstallReminder = () => {
  return (
    <div className={styles.reminder}>
      <p>
        Please ensure you have MetaMask installed on your Browser and the
        Safeheron Snap App on your two different mobile phones.
      </p>
      <div className={styles.btns}>
        <a className={styles.link} target="'_blank'" href={flaskLinkUrl}>
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
