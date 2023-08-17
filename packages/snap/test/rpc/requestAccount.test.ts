import { WalletMock } from '../wallet.mock'

describe('[RPC] requestAccount', () => {
  const walletStub = new WalletMock()

  afterEach(() => {
    walletStub.reset()
  })

  test('should return false on negative prompt confirmation', async () => {})

  test('should return empty address if no wallet', async () => {})

  test('should return address if wallet exist and approve connect confirmation', async () => {})
})
