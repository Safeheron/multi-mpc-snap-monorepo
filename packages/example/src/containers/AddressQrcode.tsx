import { message, Modal } from 'antd'
import copy from 'copy-to-clipboard'
import { QRCodeSVG } from 'qrcode.react'

import copyIcon from '@/assets/copy.png'
import styles from '@/styles/containers/AddressCard.module.less'

const AddressQrcode = ({ address, visible, onClose }) => {
  const handleCopy = () => {
    copy(address)
    message.success('Address has been copied!')
  }
  return (
    <Modal
      centered
      closable={false}
      open={visible}
      footer={null}
      width={520}
      maskClosable
      onCancel={onClose}>
      <div className={styles.addressDialog}>
        <h1>Scan QR Code</h1>
        <div className={styles.qrcode}>
          <QRCodeSVG value={`${address}`} size={200} />
        </div>

        <div className={styles.address}>
          <span>{address}</span>
          <img onClick={handleCopy} src={copyIcon} alt="" />
        </div>
      </div>
    </Modal>
  )
}

export default AddressQrcode
