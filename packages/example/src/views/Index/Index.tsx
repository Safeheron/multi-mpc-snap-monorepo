import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

import safeheron from '@/assets/safeheron.png'
import { RouterEnum } from '@/configs/Enums'
import BetaWarning from '@/containers/BetaWarning'
import Header from '@/containers/Header'
import styles from '@/styles/app/index.module.less'

import { narrower_feats, wider_feats } from './feats'

const Index = () => {
  const navigate = useNavigate()

  const goHome = () => {
    navigate(RouterEnum.home)
  }

  return (
    <div className={styles.indexWrap}>
      <Header hideNetwork>
        <Button style={{ background: '#F3F6FD' }} onClick={goHome}>
          Launch Wallet
        </Button>
      </Header>

      <div className={styles.indexPage}>
        <div className={styles.slogan}>
          <h1>A Multi-Factor Auth Wallet for Everyone</h1>
          <p>
            A fully decentralized MPC wallet with 3 key shards distributedly
            stored on MetaMask Snap,
          </p>
          <p>
            Safeheron Snap App 1, and Safeheron Snap App 2. Two devices are used
            to sign a transaction.
          </p>
          <Button onClick={goHome}>Launch Wallet</Button>
        </div>
        <div className={styles.featList}>
          {narrower_feats.map((v, i) => (
            <div
              className={styles.narrowerFeatWrap}
              style={{ backgroundImage: `url(${v.img})` }}
              key={i}>
              <h1>{v.title}</h1>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
        <div className={styles.featList} style={{ marginTop: '48px' }}>
          {wider_feats.map((v, i) => (
            <div className={styles.widerFeatWrap} key={i}>
              <div className={styles.left}>
                <img src={v.img} style={{ width: v.imgWidth + 'px' }} alt="" />
              </div>
              <div className={styles.right}>
                <h1>{v.title}</h1>
                <p>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.partner}>
          <h1>MPC Wallet Solution Powered by</h1>
          <img src={safeheron} width="200" />
        </div>
      </div>
    </div>
  )
}

export default Index
