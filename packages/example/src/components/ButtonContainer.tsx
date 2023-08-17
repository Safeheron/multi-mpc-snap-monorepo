import { FC, PropsWithChildren, ReactElement } from 'react'

import styles from '@/styles/components/ButtonContainer.module.less'

interface Props extends PropsWithChildren {
  title: string
  desc?: string | ReactElement
  buttonContent: ReactElement
}

const ButtonContainer: FC<Props> = ({
  title,
  desc,
  buttonContent,
  children,
}) => {
  return (
    <div className={styles.buttonContainer}>
      <h1>{title}</h1>

      {typeof desc === 'string' ? <p>{desc}</p> : desc}
      <section>{children}</section>
      <div className={styles.buttons}>{buttonContent}</div>
    </div>
  )
}

export default ButtonContainer
