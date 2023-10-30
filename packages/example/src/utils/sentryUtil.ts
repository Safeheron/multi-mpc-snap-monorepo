import * as Sentry from '@sentry/react'

export function getEnvironment() {
  const domain = location.host
  return domain === 'mpcsnap.safeheron.com' ? 'PROD' : 'TEST'
}

export function reportWalletCreation(
  address: string,
  walletId: string,
  walletName: string
) {
  Sentry.captureMessage(`Wallet Create Successful ${address}`, {
    level: 'info',
    extra: {
      address,
      walletId,
      walletName,
    },
  })
}

export function reportSignSuccess(
  address: string,
  walletId: string,
  method: string
) {
  Sentry.captureMessage(`Sign Successful with ${address}`, {
    level: 'info',
    extra: {
      address,
      walletId,
      method,
    },
  })
}

export function reportRecoverSuccess(
  address: string,
  walletId: string,
  walletName: string
) {
  Sentry.captureMessage(`Wallet Recover Successful ${address}`, {
    level: 'info',
    extra: {
      address,
      walletId,
      walletName,
    },
  })
}
