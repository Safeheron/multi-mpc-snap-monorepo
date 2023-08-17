import { Input, InputProps } from 'antd'
import { FC } from 'react'

interface Props extends Omit<InputProps, 'onChange'> {
  onChange?: (value: string | number) => void
  integer?: boolean
}

const NumberInput: FC<Props> = ({ onChange, integer = false, ...props }) => {
  const intReg = /[^\-?\d]/g
  const numberReg = /[^\-?\d.]/g
  const reg = integer ? intReg : numberReg

  const handleChange = e => {
    onChange && onChange(formatNumber(e.target.value))
  }

  const handleKeyUp = e => {
    e.target.value = formatNumber(e.target.value)
  }

  const formatNumber = (value: string) => {
    value = value.replace(reg, '')
    if (integer) return value
    if (value.startsWith('.')) {
      value = `0${value}`
    } else if (value.indexOf('.') !== value.lastIndexOf('.')) {
      value = value.substring(0, value.lastIndexOf('.'))
    }
    return value
  }
  return <Input onKeyUp={handleKeyUp} onChange={handleChange} {...props} />
}

export default NumberInput
