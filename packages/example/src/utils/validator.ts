import { english } from '@/utils/english'

export const mnemonicValidator = (value: string, length = 24) => {
  if (!value) {
    return false
  }
  const list = value.trim().split(/\s+/)

  if (list.length !== length) {
    return false
  }

  for (const word of list) {
    if (!english.includes(word)) {
      return false
    }
  }

  return true
}
