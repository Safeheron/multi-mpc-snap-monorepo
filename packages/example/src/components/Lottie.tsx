import lottie, { AnimationItem } from 'lottie-web'
import { CSSProperties, FC, useEffect, useRef, useState } from 'react'

import styles from '@/styles/components/Lottie.module.less'
interface Props {
  data: any
  loop?: boolean
  style?: CSSProperties
}

const Lottie: FC<Props> = ({ data, loop = true, style = {} }) => {
  const [instance, setInstance] = useState<AnimationItem>()
  const lottieRef = useRef<any>()

  useEffect(() => {
    start()
    return () => {
      instance?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!instance) return
  }, [instance])

  const start = () => {
    instance?.destroy()
    const animation = lottie.loadAnimation({
      container: lottieRef.current,
      animationData: data,
      loop,
    })

    setInstance(animation)
  }
  return <div ref={lottieRef} className={styles.lottie} style={style} />
}

export default Lottie
