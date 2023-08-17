import { Popover } from 'antd'
import { forwardRef, useImperativeHandle, useState } from 'react'

import styles from '@/styles/components/ActionPopover.module.less'

const ActionPopover = ({ content }, ref) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  useImperativeHandle(ref, () => ({
    hide: () => setOpen(false),
  }))

  return (
    <Popover
      placement="bottomRight"
      content={content}
      trigger="click"
      open={open}
      overlayClassName="action-popover"
      onOpenChange={handleOpenChange}>
      <a className={styles.popoverBtn}>
        <span></span>
      </a>
    </Popover>
  )
}

export default forwardRef(ActionPopover)
