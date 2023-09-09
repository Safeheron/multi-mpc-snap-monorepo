import * as Sentry from '@sentry/react'
import { Span } from '@sentry/react'

import { getEnvironment } from '@/utils/sentryUtil'

class Metrics {
  private txs: {
    [key: string]: ReturnType<typeof Sentry.startTransaction>
  } = {}
  private spans: Record<string, Span> = {}

  private setuped = false

  setup = () => {
    if (this.setuped) return

    Sentry.init({
      dsn: 'https://ea900b21504842f1b0126875d57cb014@o168438.ingest.sentry.io/4505168802414592',
      normalizeDepth: 5,
      sampleRate: 1,
      tracesSampleRate: 1,
      maxBreadcrumbs: 200,
      autoSessionTracking: true,
      environment: getEnvironment(),
      integrations: [
        new Sentry.Integrations.Breadcrumbs({
          console: false,
        }),
      ],
    })
    Sentry.addTracingExtensions()

    console.log('sentry init.')
    this.setuped = true
  }

  startTransaction = (
    name: string,
    tags?: { [key: string]: string | undefined }
  ) => {
    if (this.txs[name]) {
      this.txs[name].finish()
    }
    const tx = Sentry.startTransaction({ name, tags })
    this.txs[name] = tx
  }

  endTransaction = (name: string) => {
    const tx = this.txs[name]
    if (!tx) {
      return
    }
    tx.finish()
    delete this.txs[name]
  }

  setTransactionTag = (
    name: string,
    key: string,
    value: string | undefined
  ) => {
    const tx = this.txs[name]
    if (!tx) {
      return
    }
    tx.setTag(key, value)
  }

  startChild = (
    parent: string,
    op: string,
    description?: string | object | undefined
  ) => {
    const tx = this.txs[parent]
    if (!tx) {
      return
    }
    const desc =
      typeof description === 'object'
        ? JSON.stringify(description)
        : description
    const span = tx.startChild({ op, description: desc ?? '' })
    this.spans[`${parent}-${op}`] = span
  }

  endChild = (parent: string, op: string) => {
    const span = this.spans[`${parent}-${op}`]
    if (!span) {
      return
    }

    span.finish()
    delete this.spans[`${parent}-${op}`]
  }
}

export default new Metrics()
