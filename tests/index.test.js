import { createStore, applyMiddleware, compose } from 'redux'

import { FRAME_PREFIX, frame, injectCoeffects, reduxFrame } from '../src';

it('frame', () => {
  expect(frame('TEST')).toEqual(`${FRAME_PREFIX}/TEST`);
});

it('injectCoeffects', () => {
  const interceptor = injectCoeffects('coeffectTester', 'firstArg', 'secondArg');
  expect(interceptor.before({})).toEqual({
    pendingCoeffectHandler: {
      coeffectId: 'coeffectTester',
      args: ['firstArg', 'secondArg']
    }
  });
});

describe('integration', () => {
  let store;

  beforeEach(() => {
    function reducer(state = {tested: false}, action) {
      switch (action.type) {
      case 'TEST':
        return {...state, tested: action.someKey}
      default:
        return state
      }
    }

    store = createStore(
      reducer,
      applyMiddleware(reduxFrame({
        coeffectHandlers: {
          coeffectTester: (coeffects, arg1, arg2) => {
            return `testing ${arg1} ${arg2}`;
          }
        },
        effectHandlers: {}
      }))
    );
  })

  it('creates the right context map', () => {
    const contextMap = store.dispatch({
      type: frame('TEST'),
      someKey: 'tested',
      interceptors: [injectCoeffects('coeffectTester', 'asdfa', '1234')]
    });

    expect(contextMap.coeffects).toEqual({
      action: {
        type: 'TEST',
        someKey: 'tested'
      },
      coeffectTester: 'testing asdfa 1234',
      state: {
        tested: false
      }
    });

    expect(contextMap.effects).toEqual({
      dispatch: {
        'type': 'TEST',
        'someKey': 'tested'
      }
    });

    expect(contextMap.stack.length).toEqual(4);
    expect(contextMap.queue.length).toEqual(4);
  });
});
