import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

import metamask from '@/assets/metamask.png'
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
            An innovative wallet using 3 key shards that are distributedly
            stored on MetaMask Snap, Safeheron Snap App 1 and Safeheron Snap App
            2. Two devices are used to sign a transaction.
          </p>
          <Button onClick={goHome}>Launch Wallet</Button>
        </div>
        <ul>
          {feats.map((v, i) => (
            <li key={i}>
              <img src={v.img} width="290" />
              <h1>{v.title}</h1>
              <p>{v.desc}</p>
            </li>
          ))}
        </ul>
        <div className={styles.partner}>
          <h1>MPC Wallet Solution Powered by</h1>
          <img src={safeheron} width="232" />
        </div>
        <div className={styles.partner}>
          <h1>Partner</h1>
          <img src={metamask} width="212" />
        </div>
      </div>
    </>
  )
}

export default Index
