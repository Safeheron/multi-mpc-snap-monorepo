import '../../src/rpc/'

import { WalletMock } from '../wallet.mock'

describe('[RPC] CreateWallet should success', () => {
  const walletStub = new WalletMock()
  afterAll(() => {
    walletStub.reset()
  })

  test('Approval Create Wallet', () => {})
})

describe('[RPC] CreateWallet should be failed', () => {
  const walletStub = new WalletMock()
  afterAll(() => {
    walletStub.reset()
  })
})
