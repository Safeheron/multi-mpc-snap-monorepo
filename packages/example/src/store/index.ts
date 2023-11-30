import { configure } from 'mobx'
import { createContext, useContext } from 'react'

import BackupModule from '@/store/module/BackupModule'
import KeygenModule from '@/store/module/keygenModule'
import NetworkModule from '@/store/module/NetworkModule'
import RecoveryModule from '@/store/module/RecoveryModule'
import SignModule from '@/store/module/SignModule'

import AccountModule from './module/AccountModule'
import Interactive from './module/Interactive'
import TransactionModule from './module/TransactionModule'

configure({
  enforceActions: 'never',
})

const store = {
  accountModule: new AccountModule(),
  interactive: new Interactive(),
  transactionModule: new TransactionModule(),
  networkModule: new NetworkModule(),

  keygenModule: new KeygenModule(),
  signModule: new SignModule(),
  backupModule: new BackupModule(),
  recoveryModule: new RecoveryModule(),
}
const StoreContext = createContext<typeof store>(store)

const useStore = () => {
  const storeContext = useContext(StoreContext)
  return storeContext
}

export { store, StoreContext, useStore }
