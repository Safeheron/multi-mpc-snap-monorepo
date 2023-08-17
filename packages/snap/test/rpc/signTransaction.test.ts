import { WalletMock } from '../wallet.mock'

describe('[RPC] SignTransaction', () => {
  const txObject = {
    nonce: 0,
    to: '0x83682797C5165878a17EBfB6DE7cd7F528033130',
    value: '0.00001',
    chainId: 3,
    data: '',
    maxFeePerGas: '100',
    maxPriorityFeePerGas: '1000',
    gasLimit: 20000,
  }

  const walletStub = new WalletMock()
  afterAll(() => {
    walletStub.reset()
  })

  describe('Should signed success', () => {})

  describe('Should signed failed', () => {
    test('Should create sign context failed on negative prompt confimation', async () => {})

    test('Should step1 failed on skip create context', async () => {})

    test('Should step2 faild on skip steps that before step2', async () => {})
  })
})
