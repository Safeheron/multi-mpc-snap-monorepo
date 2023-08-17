export const RECORDS_KEY = 'x-records'

const StorageUtil = {
  get(key: string, jsonfy = false) {
    const res = localStorage.getItem(key)
    if (res && jsonfy) {
      return JSON.parse(res)
    }
    return res
  },

  set(key: string, value: any, stringfy = false) {
    let newValue = ''
    if (stringfy) {
      newValue = JSON.stringify(value)
    }
    localStorage.setItem(key, value)
  },
}

export default StorageUtil
