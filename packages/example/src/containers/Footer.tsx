import styled from 'styled-components'

const FooterWrapper = styled.div`
  color: #6b6d7c;
  font-size: 12px;
  text-align: center;
  padding: 50px 0;
  width: 100%;
  div {
    display: inline-block;
  }
  span {
    margin: 0 10px;
  }
  .link {
    cursor: pointer;
  }
`

const Footer = () => {
  return (
    <FooterWrapper>
      <div>© 2023 Safeheron</div>
      <span>|</span>
      <a
        className={'link'}
        target={'_blank'}
        href={'https://github.com/Safeheron/snap-offline-recovery-tool'}>
        Recover Private Key
      </a>
    </FooterWrapper>
  )
}

export default Footer
