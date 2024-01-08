import lottie, { AnimationItem } from 'lottie-web'
import { CSSProperties, FC, useEffect, useRef, useState } from 'react'

import styles from '@/styles/components/Lottie.module.less'
interface Props {
  data: any
  style?: CSSProperties
}

const Lottie: FC<Props> = ({ data, style = {} }) => {
  const lottieRef = useRef<any>()

  const [instance, setInstance] = useState<AnimationItem>()

  useEffect(() => {
    if (lottieRef.current) {
      start()
    }
    return () => {
      instance?.destroy()
    }
  }, [lottieRef.current])

  const start = () => {
    instance?.destroy()
    const animation = lottie.loadAnimation({
      container: lottieRef.current,
      animationData: data,
      loop: true,
    })

    setInstance(animation)
  }
  return <div ref={lottieRef} className={styles.lottie} style={style} />
}

export default Lottie
