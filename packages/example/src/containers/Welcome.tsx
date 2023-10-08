import welcome from '@/assets/welcome.png'
import InstallReminder from '@/components/InstallReminder'
import styles from '@/styles/containers/Welcome.module.less'

const Welcome = () => {
  return (
    <div className={styles.welcome}>
      <InstallReminder />
      <div className={styles.imgBox}>
        <img src={welcome} width="869" />
      </div>
    </div>
  )
}

export default Welcome
