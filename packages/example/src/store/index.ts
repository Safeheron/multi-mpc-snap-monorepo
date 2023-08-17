import { configure } from 'mobx'
import { createContext, useContext } from 'react'

import SnapRequestModule from '@/store/module/SnapRequestModule'

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
  snapRequestModule: new SnapRequestModule(),
}
const StoreContext = createContext<typeof store>(store)

const useStore = () => {
  const storeContext = useContext(StoreContext)
  return storeContext
}

export { store, StoreContext, useStore }
