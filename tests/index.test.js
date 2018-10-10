import { createStore, applyMiddleware, compose } from 'redux'

import {
  effect,
  FRAME_PREFIX,
  frame,
  injectCoeffects,
  interceptors,
  mergeWithCoeffects,
  mergeWithEffects,
  reduxFrame,
} from '../src';

it('frame', () => {
  expect(frame('TEST')).toEqual(`${FRAME_PREFIX}/TEST`);
});

it('injectCoeffects', () => {
  const interceptor = injectCoeffects('coeffectTester', {arg1: 'arg1Value'});
  expect(interceptor.before({})).toEqual({
    pendingCoeffectHandler: {
      coeffectId: 'coeffectTester',
      args: {arg1: 'arg1Value'}
    }
  });
});

it('calls the built in dispatch effect handler', () => {
  const mockStore = {
    dispatch: jest.fn(),
    getState: () => ({})
  }

  const fn = reduxFrame()(mockStore)(() => {});

  fn({
    type: frame('TEST'),
    interceptors: [interceptors.dispatch]
  });

  expect(mockStore.dispatch).toBeCalledWith({ type: 'TEST' });
});

describe('effect', () => {
  it('creates an interceptor that adds the effect key and args to context.effects', () => {
    const interceptor = effect('someEffectId', {someArg: 'someArgValue'});
    const context = {};
    const result = interceptor.after(context);
    expect(result.effects.someEffectId).toEqual({someArg: 'someArgValue'});
  });
});

describe('mergeWithEffects', () => {
  it('merges the effect with effects', () => {
    const context = {
      effects: {
        someEffect: null
      }
    }

    const result = mergeWithEffects(context, { newEffect: null });
    expect(result.effects).toEqual({
      newEffect: null,
      someEffect: null,
    })
  });
});

describe('mergeWithCoeffects', () => {
  it('merges the coeffect with coeffects', () => {
    const context = {
      coeffects: {
        someCoeffect: null
      }
    }

    const result = mergeWithCoeffects(context, { newCoeffect: null });
    expect(result.coeffects).toEqual({
      newCoeffect: null,
      someCoeffect: null,
    })
  });
});

it('does the stack and queue in the right order', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({})
  }

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

  const fn = reduxFrame()(mockStore)(() => {});

  fn({
    type: frame('TEST'),
    interceptors: [a, b, c]
  });

  expect(testStack).toEqual(['a', 'b', 'c']);
  expect(testQueue).toEqual(['c', 'b', 'a']);
});

it('calls registered coeffect handlers', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({})
  }

  const fn = reduxFrame({
    coeffectHandlers: {
      testCoeffect: (coeffects, args) => `tested ${args.arg1} ${args.arg2}`
    }
  })(mockStore)(() => {});

  const contextMap = fn({
    type: frame('TEST'),
    interceptors: [injectCoeffects('testCoeffect', {arg1: 'arg1', arg2: 'arg2'})]
  });

  expect(contextMap.coeffects.testCoeffect).toEqual('tested arg1 arg2');
});

it('calls registered effect handlers', () => {
  const testEffect = jest.fn();

  const mockStore = {
    dispatch: () => {},
    getState: () => ({})
  }

  const fn = reduxFrame({
    effectHandlers: {
      testEffect
    }
  })(mockStore)(() => {});

  const contextMap = fn({
    type: frame('TEST'),
    interceptors: [effect('testEffect', { testEffect: 'arg' })]
  });

  expect(testEffect).toBeCalled();
  const args = testEffect.mock.calls[0];
  expect(args[0]).toEqual({
    action: {
      type: 'TEST'
    },
    state: {}
  });
  expect(args[1]).toEqual({ testEffect: 'arg' });
  expect(args[2]).toBeInstanceOf(Function);
});

describe('integration with Redux', () => {
  it('creates the right context map with all defaults', () => {
    function reducer(state = {tested: false}, action) {
      switch (action.type) {
      case 'TEST':
        return {...state, tested: action.someKey}
      default:
        return state
      }
    }

    const store = createStore(
      reducer,
      applyMiddleware(reduxFrame())
    );

    const contextMap = store.dispatch({
      type: frame('TEST'),
      someKey: 'tested'
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

    expect(contextMap.effects).toEqual({});

    expect(contextMap.stack.length).toEqual(2);
    expect(contextMap.queue.length).toEqual(2);
  });
});
