import styled from 'styled-components'

import welcome from '@/assets/welcome.png'
import InstallReminder from '@/components/InstallReminder'

const WelcomeContainer = styled.div`
  padding: 100px 0 110px;

  > .img-box {
    margin-top: 88px;
    padding: 0 80px;
    text-align: center;
  }
`

const Welcome = () => {
  return (
    <WelcomeContainer>
      <InstallReminder />
      <div className={'img-box'}>
        <img src={welcome} width="869" />
      </div>
    </WelcomeContainer>
  )
}

export default Welcome
