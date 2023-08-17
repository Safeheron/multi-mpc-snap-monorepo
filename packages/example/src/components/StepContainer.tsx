import { FC, ReactElement } from 'react'

import styles from '@/styles/components/StepContainer.module.less'
interface Props {
  leftContent: ReactElement
  rightContent: ReactElement
  buttonContent: ReactElement
}
const StepContainer: FC<Props> = ({
  leftContent,
  rightContent,
  buttonContent,
}) => {
  return (
    <div className={styles.stepContainer}>
      <div className={styles.left}>
        {leftContent}
        <div className={styles.buttonContent}>{buttonContent}</div>
      </div>
      <div className={styles.right}>{rightContent}</div>
    </div>
  )
}

export default StepContainer
