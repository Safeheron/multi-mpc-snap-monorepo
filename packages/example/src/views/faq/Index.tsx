import React from 'react'
import styled from 'styled-components'

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

const FAQ = () => {
  return (
    <FaqWrapper>
      <Header hideNetwork />
      <iframe
        width="800"
        height="400"
        style={{ marginTop: '120px' }}
        src="https://www.youtube.com/embed/588bNXEiS_s"
        title="Safeheron Partners with MetaMask, MPCSnap -- FIRST MPC Wallet Between Extension &amp; Hardware"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen></iframe>
      <FaqTextWrapper>
        <p>Get Started with Safeheron Snap</p>
        <p>
          Welcome to Safeheron Snap! A multi-factor authentication
          self-custodial wallet utilizing 3 key shards.
        </p>
        <p>
          Here are all the essentials you need to enjoy it in a fully
          decentralized system, such as creating your wallet, recovering your
          key shard, and signing transactions, etc.
        </p>
        <p>
          If you encounter any problems, please send an email to
          support@safeheron.com.
        </p>
      </FaqTextWrapper>
    </FaqWrapper>
  )
}

export default FAQ
