import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { ToastProvider } from './components/Toast/ToastContext'
import RootComponent from './RootComponent'
import { persistor, store } from './store/reducers/store'

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
      >
        <BrowserRouter basename={'/'}>
          <ToastProvider>
            <RootComponent />
          </ToastProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  )
}

export default App
