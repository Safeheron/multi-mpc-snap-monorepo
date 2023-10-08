import React from 'react'
import styled from 'styled-components'

import Header from '@/containers/Header'

const FaqWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
      <div>
        <p>This is a test title</p>
        <p>this is a real text</p>
      </div>
    </FaqWrapper>
  )
}

export default FAQ
