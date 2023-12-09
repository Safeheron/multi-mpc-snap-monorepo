import { Loading3QuartersOutlined } from '@ant-design/icons'
import { FC } from 'react'
import styled from 'styled-components'

interface Props {
  loading: boolean
  text?: string
}

const LoadingContainer = styled.div`
  position: fixed;

  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 9999;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  span {
    margin-bottom: 10px;
    color: white;
  }
`

const Loading: FC<Props> = ({ loading, text }) => {
  if (!loading) {
    return null
  }
  return (
    <LoadingContainer>
      <span>{text}</span>
      <Loading3QuartersOutlined style={{ fontSize: 42, color: 'white' }} spin />
    </LoadingContainer>
  )
}

export default Loading
