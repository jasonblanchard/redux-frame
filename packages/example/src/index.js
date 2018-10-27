
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { frame } from 'redux-frame';
import App from './App';
import store from './store';

store.dispatch({
  type: frame('INITIALIZE'),
  interceptors: [
    ['effect', { effectId: 'debug' }],
    ['injectCoeffects', { coeffectId: 'defaultsFromLocalStorage', args: { key: 'stuff' } }],
    ['effect', { effectId: 'dispatch' }],
    ['path', { from: 'defaultsFromLocalStorage', to: 'action.stuff' }],
  ],
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
