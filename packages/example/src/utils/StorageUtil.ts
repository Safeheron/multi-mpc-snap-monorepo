export const RECORDS_KEY = 'x-records'

const StorageUtil = {
  get(key: string, jsonfy = false) {
    const res = localStorage.getItem(key)
    if (res && jsonfy) {
      return JSON.parse(res)
    }
    return res
  },

  set(key: string, value: any, stringify = false) {
    let newValue = ''
    if (stringify) {
      newValue = JSON.stringify(value)
    }
    localStorage.setItem(key, newValue)
  },
}

export default StorageUtil
