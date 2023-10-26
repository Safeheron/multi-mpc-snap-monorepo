import '@/styles/common.less'

import { ConfigProvider } from 'antd'
import ReactDOM from 'react-dom/client'

import App from '@/App'
import { MetaMaskProvider } from '@/hooks/MetamaskContext'
import { SnapKeepAliveProvider } from '@/hooks/SnapKeepAliveContext'
import { store, StoreContext } from '@/store'
import { IS_PROD } from '@/utils'
import { logger } from '@/utils/Log'
import metrics from '@/utils/Metrics'

logger.setLevel(IS_PROD ? 'error' : 'debug')
metrics.setup()

const root = document.getElementById('root') as HTMLElement

ReactDOM.createRoot(root).render(
  <StoreContext.Provider value={store}>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#496CE9',
        },
      }}>
      <MetaMaskProvider>
        <SnapKeepAliveProvider>
          <App />
        </SnapKeepAliveProvider>
      </MetaMaskProvider>
    </ConfigProvider>
  </StoreContext.Provider>
)
