import { Modal } from 'antd'
import { observer } from 'mobx-react-lite'

import ConfirmForm from '@/containers/ConfirmForm'
import SendForm from '@/containers/SendForm'
import { useStore } from '@/store'

const SendDialog = () => {
  const { interactive } = useStore()
  const { sendFormCompleted } = interactive

  return (
    <Modal centered closable={false} open={true} footer={null} width={720}>
      {sendFormCompleted ? <ConfirmForm /> : <SendForm />}
    </Modal>
  )
}

export default observer(SendDialog)
