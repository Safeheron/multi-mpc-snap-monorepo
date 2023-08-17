import { FC } from 'react'

import step from '@/assets/step.png'
import stepGray from '@/assets/step-gray.png'
import success from '@/assets/success.png'
import styles from '@/styles/components/StepText.module.less'

import loading from '../assets/loading-little.png'
interface Props {
  steps: {
    title: string
    desc?: string
    successText: string
    loadingText?: string
  }[]
  stepIndex: number
  loadingStep: number
}

const StepText: FC<Props> = ({ steps, stepIndex, loadingStep }) => {
  return (
    <div className={styles.stepContent}>
      <ul>
        {steps.map((v, i) => (
          <li className={stepIndex > i ? styles.active : ''} key={i}>
            <div
              className={`${styles.icon} ${stepIndex > i ? styles.active : ''}
               `}>
              <img src={stepIndex > i ? step : stepGray} />
            </div>
            <div className={styles.line}></div>
            <h1>{v.title}</h1>
            <p>{v.desc}</p>
            {stepIndex > i + 1 && (
              <div className={styles.success}>
                <img src={success} width={14} />
                <span>{v.successText}</span>
              </div>
            )}
            {i + 1 === loadingStep && stepIndex === loadingStep && (
              <div className={styles.loading}>
                <img className={styles.loadingImg} src={loading} width={14} />
                <span>{v.loadingText}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default StepText
