import React from 'react'
import styled from 'styled-components'

import { FAQ_VIDEO_LINK } from '@/configs/Configs'
import Header from '@/containers/Header'

const FaqWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const FaqTextWrapper = styled.div`
  margin-top: 30px;
  width: 800px;
  height: 400px;
`

const FaqTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
`
const FaqDesc = styled.div`
  color: #6b6d7c;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 8px;
`

const FAQ = () => {
  return (
    <FaqWrapper>
      <Header hideNetwork />
      <iframe
        width="800"
        height="400"
        style={{ marginTop: '120px' }}
        src={FAQ_VIDEO_LINK}
        title="Safeheron Partners with MetaMask, MPCSnap -- FIRST MPC Wallet Between Extension &amp; Hardware"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen></iframe>
      <FaqTextWrapper>
        <FaqTitle>Get Started with Safeheron Snap</FaqTitle>
        <FaqDesc>
          Welcome to Safeheron Snap! A multi-factor authentication
          self-custodial wallet utilizing 3 key shards.
        </FaqDesc>
        <FaqDesc>
          Here are all the essentials you need to enjoy it in a fully
          decentralized system, such as creating your wallet, recovering your
          key shard, and signing transactions, etc.
        </FaqDesc>
        <FaqDesc>
          If you encounter any problems, please send an email to
          <a target={'_blank'} href={'mailto:mpcsnap@safeheron.com'}>
            {' '}
            mpcsnap@safeheron.com
          </a>
          .
        </FaqDesc>
      </FaqTextWrapper>
    </FaqWrapper>
  )
}

export default FAQ
