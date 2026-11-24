import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StyleProvider } from '@ant-design/cssinjs'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/app/queryClient'
import { store } from '@/app/store'
import { theme } from '@/app/theme'
import { App } from './App'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root is missing')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <StyleProvider layer>
          <ConfigProvider theme={theme}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ConfigProvider>
        </StyleProvider>
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
)
