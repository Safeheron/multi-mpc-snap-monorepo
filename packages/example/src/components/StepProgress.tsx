import classNames from 'classnames'

import styles from '@/styles/components/StepProgress.module.less'

const StepProgress = ({ steps, stepIndex }) => {
  return (
    <ul className={styles.stepProgress}>
      {steps.map((v, i) => (
        <li
          key={i}
          className={classNames({ [styles.active]: i + 1 <= stepIndex })}>
          <b>{i + 1} </b>
          {v}
          {i !== steps.length - 1 && <div></div>}
        </li>
      ))}
    </ul>
  )
}

export default StepProgress
