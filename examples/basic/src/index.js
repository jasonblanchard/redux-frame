import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createStore, applyMiddleware, compose } from 'redux'

import { frame, reduxFrame, injectCoeffects } from './redux-frame';

function reducer(state = {num: 0}, action) {
  switch (action.type) {
  case 'INCREMENT':
    return {...state, num: state.num + 1}
  case 'DECREMENT':
    return {...state, num: state.num - 1}
  case 'TEST':
    return {...state, tested: action.someKey}
  default:
    return state
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  composeEnhancers(
    applyMiddleware(reduxFrame({
      coeffectHandlers: {
        coeffectTester: () => {
          return 'test';
        }
      },
      effectHandlers: {}
    }))
  )
)

const beforeLoggerInterceptor = {
  before: context => console.log('beforeLoggerInterceptor', context),
  after: context => console.log('should be the last thing', context)
}

const inBetween = {
  before: context => console.log('inBetween before'),
  after: context => console.log('inBetween after')
}

const afterLoggerInterceptor = {
  after: context => console.log('afterLoggerInterceptor', context)
}

store.dispatch({ type: 'INCREMENT' });
store.dispatch({
  type: frame('TEST'),
  someKey: 'tested',
  interceptors: [injectCoeffects('coeffectTester', 'asdfa'), beforeLoggerInterceptor, inBetween, afterLoggerInterceptor]
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
