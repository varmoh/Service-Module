import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage
import data from './data'

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['data'], // elements that will be persisted
    blacklist: [] // elements that will not be persisted
}

const rootReducer = combineReducers({
    data
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({reducer: persistedReducer})
const persistor = persistStore(store)

export { store, persistor }
