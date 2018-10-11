
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { frame, interceptors as reduxFrameInterceptors, injectCoeffects } from './redux-frame';
import App from './App';
import interceptors from './interceptors';
import store from './store';

store.dispatch({
  type: frame('INITIALIZE'),
  interceptors: [reduxFrameInterceptors.debug, injectCoeffects('defaultsFromLocalStorage', { key: 'stuff' }), interceptors.addDefaultsToActionPayload, reduxFrameInterceptors.dispatch]
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
