import React from 'react'
import styled from 'styled-components'

const BetaWrap = styled.div`
  width: 100%;
  padding: 16px 0;
  background-color: #e972071a;
  text-align: center;
  color: #e97207;
  font-size: 14px;
  font-weight: 500;
`

const BetaWarning = () => {
  return (
    <BetaWrap>
      This is the Open Beta version and updates are made frequently. As a
      self-custodial wallet, users need to take care of their own assets and
      DYOR (Do Your Own Research) before using it.
    </BetaWrap>
  )
}

export default BetaWarning
