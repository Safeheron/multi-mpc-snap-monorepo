import { observer } from 'mobx-react-lite'
import { FC, PropsWithChildren } from 'react'
import styled from 'styled-components'

import logo from '@/assets/logo.png'
import { useStore } from '@/store'

interface HeaderProps extends PropsWithChildren {
  hideNetwork?: boolean
}

const HeaderWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 9;
  backdrop-filter: blur(5px);
  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 73px;
    margin: 0 auto;
    width: 1200px;
    .logo-box {
      flex: 1;
      display: flex;
      cursor: pointer;
      .text {
        margin-left: 12px;
      }
      .title {
        font-size: 20px;
        color: #262833;
        font-weight: bold;
        margin-bottom: 4px;
        margin-top: 3px;
      }
      .desc {
        margin-top: -5px;
        font-size: 12px;
        color: #6b6d7c;
      }
    }
    .network {
      flex: 1;
      display: flex;
      justify-content: center;
      height: 73px;
      align-items: center;
      span {
        height: 32px;
        line-height: 32px;
        padding: 0 20px;
        border-radius: 32px;
        border: 1px dashed #d9d9d9;
      }
    }
    .right-content {
      flex: 1;
      display: flex;
      justify-content: flex-end;
    }
  }
`

const Header: FC<HeaderProps> = ({ hideNetwork, children }) => {
  const { networkModule } = useStore()
  const { hexChainId, chainName, fetchChainListFailed } = networkModule

  const toIndex = () => {
    window.open(location.origin)
  }

  return (
    <HeaderWrapper>
      <div className={'container'}>
        <div className={'logo-box'} onClick={toIndex}>
          <div>
            <img src={logo} width={42} alt={'Safeheron Logo'} />
          </div>
          <div className={'text'}>
            <div className={'title'}>Safeheron Snap</div>
            <div className={'desc'}>Enable MPC Wallet within MetaMask</div>
          </div>
        </div>
        {hideNetwork ? (
          <div></div>
        ) : (
          <div className={'network'}>
            {fetchChainListFailed && (
              <span>ChainId: {parseInt(hexChainId)}</span>
            )}
            {chainName && <span>{chainName}</span>}
          </div>
        )}
        <div className={'right-content'}>{children}</div>
      </div>
    </HeaderWrapper>
  )
}

export default observer(Header)
