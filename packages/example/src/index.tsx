import '@/styles/common.less'

import { ConfigProvider } from 'antd'
import ReactDOM from 'react-dom/client'

import App from '@/App'
import { store, StoreContext } from '@/store'
const root = document.getElementById('root') as HTMLElement

ReactDOM.createRoot(root).render(
  <StoreContext.Provider value={store}>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#496CE9',
        },
      }}>
      <App />
    </ConfigProvider>
  </StoreContext.Provider>
)
