import { makeAutoObservable } from 'mobx'

class Interactive {
  // common
  loading = false

  progress = 0

  constructor() {
    makeAutoObservable(this)
  }

  setLoading(value: boolean) {
    this.loading = value
  }

  setProgress(value) {
    this.progress = value
  }

  setProgressAdd(value) {
    const newVal = Math.max(this.progress + value, value)
    this.progress = Math.min(100, newVal)
  }
}

export default Interactive
