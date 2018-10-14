
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { path, frame, interceptors as reduxFrameInterceptors, injectCoeffects } from './redux-frame';
import App from './App';
import store from './store';

store.dispatch({
  type: frame('INITIALIZE'),
  interceptors: [reduxFrameInterceptors.debug, injectCoeffects('defaultsFromLocalStorage', { key: 'stuff' }), path({ from: 'defaultsFromLocalStorage', to: 'action.stuff' }), reduxFrameInterceptors.dispatch]
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
