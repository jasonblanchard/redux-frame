
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { coeffectToAction, frame, interceptors as reduxFrameInterceptors, injectCoeffects } from './redux-frame';
import App from './App';
import store from './store';

store.dispatch({
  type: frame('INITIALIZE'),
  interceptors: [reduxFrameInterceptors.debug, injectCoeffects('defaultsFromLocalStorage', { key: 'stuff' }), coeffectToAction({ from: 'defaultsFromLocalStorage', to: 'stuff' }), reduxFrameInterceptors.dispatch]
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
