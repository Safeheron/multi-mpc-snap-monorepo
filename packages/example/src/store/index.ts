import { configure } from 'mobx'
import { createContext, useContext } from 'react'

import BackupModule from '@/store/module/BackupModule'
import NetworkModule from '@/store/module/NetworkModule'
import RecoveryModule from '@/store/module/RecoveryModule'
import SignModule from '@/store/module/SignModule'

import AccountModule from './module/AccountModule'
import Interactive from './module/Interactive'
import MessageModule from './module/MessageModule'
import TransactionModule from './module/TransactionModule'

configure({
  enforceActions: 'never',
})

const store = {
  accountModule: new AccountModule(),
  messageModule: new MessageModule(),
  interactive: new Interactive(),
  transactionModule: new TransactionModule(),
  signModule: new SignModule(),
  networkModule: new NetworkModule(),

  backupModule: new BackupModule(),
  recoveryModule: new RecoveryModule(),
}
const StoreContext = createContext<typeof store>(store)

const useStore = () => {
  const storeContext = useContext(StoreContext)
  return storeContext
}

export { store, StoreContext, useStore }
