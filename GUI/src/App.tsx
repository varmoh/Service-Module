import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './components/Toast/ToastContext'
import RootComponent from './RootComponent'
import { store as reducer} from './store/reducers/store'
import useStore from "./store/store";
import {useQuery} from "@tanstack/react-query";
import {UserInfo} from "./types/userInfo";

const App: React.FC = () => {
    if(import.meta.env.REACT_APP_LOCAL === 'true') {
        const { data } = useQuery<UserInfo>({
            queryKey: ['cs-custom-jwt-userinfo', 'prod'],
            onSuccess: (res: any) => useStore.getState().setUserInfo(res)
        })
    } else {
        const { data: userInfo } = useQuery<UserInfo>({
            queryKey: [import.meta.env.REACT_APP_AUTH_PATH, 'auth'],
            onSuccess: (data: { data: { custom_jwt_userinfo: UserInfo } }) => {
                localStorage.setItem(
                    'exp',
                    data.data.custom_jwt_userinfo.JWTExpirationTimestamp
                );
                return useStore.getState().setUserInfo(data.data.custom_jwt_userinfo);
            }
        });
    }


    return (
    <Provider store={reducer}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ToastProvider>
          <RootComponent />
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  )
}

export default App
