import { createStore, applyMiddleware, compose } from 'redux'

import { FRAME_PREFIX, frame, injectCoeffects, reduxFrame, mergeWithEffects } from '../src';

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

describe('integration with Redux', () => {
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
      applyMiddleware(reduxFrame())
    );
  })

  it('creates the right context map', () => {
    const contextMap = store.dispatch({
      type: frame('TEST'),
      someKey: 'tested',
      interceptors: []
    });

    expect(contextMap.coeffects).toEqual({
      action: {
        type: 'TEST',
        someKey: 'tested'
      },
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

    expect(contextMap.stack.length).toEqual(3);
    expect(contextMap.queue.length).toEqual(3);
  });

  it('does the stack and queue in the right order', () => {
    // NOTE: These interceptors do side-effects for testing purposes. Don't do this. Instead, put the effects in effect handlers.
    const testStack = [];
    const testQueue = [];

    const a = {
      before: () => {
        testStack.push('a');
        return undefined;
      },
      after: () => {
        testQueue.push('a');
        return undefined;
      }
    }

    const b = {
      before: () => {
        testStack.push('b');
        return undefined;
      },
      after: () => {
        testQueue.push('b');
        return undefined;
      }
    }

    const c = {
      before: () => {
        testStack.push('c');
        return undefined;
      },
      after: () => {
        testQueue.push('c');
        return undefined;
      }
    }

    const contextMap = store.dispatch({
      type: frame('TEST'),
      interceptors: [a, b, c]
    });

    expect(testStack).toEqual(['a', 'b', 'c']);
    expect(testQueue).toEqual(['c', 'b', 'a']);
  })

  it('calls registered coeffect handlers', () => {
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
          testCoeffect: (coeffects, arg1, arg2) => `tested ${arg1} ${arg2}`
        }
      }))
    );

    const contextMap = store.dispatch({
      type: frame('TEST'),
      interceptors: [injectCoeffects('testCoeffect', 'arg1', 'arg2')]
    });

    expect(contextMap.coeffects.testCoeffect).toEqual('tested arg1 arg2');
  });

  it('calls registered effect handlers', () => {
    function reducer(state = {tested: false}, action) {
      switch (action.type) {
      case 'TEST':
        return {...state, tested: action.someKey}
      default:
        return state
      }
    }

    const testEffect = jest.fn((coeffects, arg1, arg2) => `tested ${arg1} ${arg2}`);

    store = createStore(
      reducer,
      applyMiddleware(reduxFrame({
        effectHandlers: {
          testEffect
        }
      }))
    );

    const doTestEffectInterceptor = {
      after: context => mergeWithEffects(context, { testEffect: 'arg' })
    }

    const contextMap = store.dispatch({
      type: frame('TEST'),
      interceptors: [doTestEffectInterceptor]
    });

    expect(testEffect).toBeCalledWith({
      action: {
        type: 'TEST'
      },
      state: {
        tested: false
      }
    }, 'arg');
  });
});