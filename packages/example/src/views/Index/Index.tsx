import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

import safeheron from '@/assets/safeheron.png'
import { RouterEnum } from '@/configs/Enums'
import Header from '@/containers/Header'
import styles from '@/styles/app/index.module.less'

import { feats } from './feats'

const Index = () => {
  const navigate = useNavigate()

  const goHome = () => {
    navigate(RouterEnum.home)
  }

  return (
    <>
      <Header>
        <Button onClick={goHome}>Launch Wallet</Button>
      </Header>

      <div className={styles.indexPage}>
        <div className={styles.slogan}>
          <h1>A Multi-Factor Auth Wallet for Everyone</h1>
          <p>
            A fully decentralized MPC wallet with 3 key shards distributedly
            stored on MetaMask Snap, Safeheron Snap App 1, and Safeheron Snap
            App 2. Two devices are used to sign a transaction.
          </p>
          <Button onClick={goHome}>Launch Wallet</Button>
        </div>
        <div className={styles.featList}>
          {feats.map((v, i) => (
            <div className={styles.featWrap} key={i}>
              <img src={v.img} width="180" />
              <div className={styles.featRight}>
                <h1>{v.title}</h1>
                <p>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.partner}>
          <h1>MPC Wallet Solution Powered by</h1>
          <img src={safeheron} width="232" />
        </div>
      </div>
    </>
  )
}

export default Index
