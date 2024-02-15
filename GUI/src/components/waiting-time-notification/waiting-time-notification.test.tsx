import React from 'react';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '../../utils/test-utils';
import WaitingTimeNotification from './waiting-time-notification';
import chatReducer from '../../slices/chat-slice';
import widgetReducer from '../../slices/widget-slice';
import { initialChatState } from '../../test-initial-states';

let openStore: EnhancedStore;

function createOpenStore() {
  return configureStore({
    reducer: {
      chat: chatReducer,
      widget: widgetReducer,
    },
    preloadedState: {
      chat: initialChatState,
    },
  });
}

// describe('waiting time notification', () => {
//   it('should render estimated waiting time message', () => {
//     openStore = createOpenStore();
//     render(
//       <Provider store={openStore}>
//         <WaitingTimeNotification />
//       </Provider>,
//     );
//     screen.getByText('Hetkel on lõik klienditeenindajad hõivatud.');
//   });
// });
