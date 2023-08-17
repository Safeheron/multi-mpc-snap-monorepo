import { WalletMock } from '../wallet.mock'

const password = '123456'

describe('[RPC] walletManagement', () => {
  const walletStub = new WalletMock()

  describe('test query Backup status', () => {
    afterEach(() => {
      walletStub.reset()
    })
  })
})
