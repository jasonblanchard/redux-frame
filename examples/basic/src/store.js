import { createStore, applyMiddleware, compose } from 'redux'

import { reduxFrame } from './redux-frame';
import coeffectHandlers from './coeffects';
import effectHandlers from './effects';

function reducer(state = {stuff: []}, action) {
  switch (action.type) {
  case 'ADD_STUFF':
    return {
      stuff: [
        action.thing,
        ...state.stuff
      ]
    }
  case 'INITIALIZE':
    return {
      stuff: action.stuff || []
    };
  case 'CLEAR_STUFF':
    return {
      stuff: []
    }
  default:
    return state
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(
  reducer,
  composeEnhancers(
    applyMiddleware(reduxFrame({
      coeffectHandlers,
      effectHandlers
    }))
  )
)
