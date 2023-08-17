import { Modal } from 'antd'
export const CANCEL_CONFIRM_TEXT =
  'Confirm cancellation? Cancelling will terminate this operation process.'

function useConfirm() {
  const showConfirm = ({ content, onOk }) => {
    Modal.confirm({
      icon: null,
      width: 335,
      centered: true,
      content,
      okText: 'Confirm',
      onOk() {
        onOk()
      },
    })
  }

  const showInfo = ({ content }) => {
    Modal.info({
      icon: null,
      width: 335,
      centered: true,
      content,
      okText: 'Confirm',
    })
  }

  return { showConfirm, showInfo }
}

export default useConfirm
