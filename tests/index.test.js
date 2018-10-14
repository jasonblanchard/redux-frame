/* eslint-disable no-console */
import { createStore, applyMiddleware } from 'redux';

import {
  effect,
  enqueue,
  FRAME_PREFIX,
  frame,
  injectCoeffects,
  interceptors,
  mergeWithCoeffects,
  mergeWithEffects,
  path,
  reduxFrame,
} from '../src';

it('frame', () => {
  expect(frame('TEST')).toEqual(`${FRAME_PREFIX}/TEST`);
});

it('injectCoeffects', () => {
  const interceptor = injectCoeffects('coeffectTester', { arg1: 'arg1Value' });
  expect(interceptor.before({})).toEqual({
    coeffects: {
      pendingCoeffectHandler: {
        coeffectId: 'coeffectTester',
        args: { arg1: 'arg1Value' },
      },
    },
  });
});

it('calls the built in dispatch effect handler', () => {
  const mockStore = {
    dispatch: jest.fn(),
    getState: () => ({}),
  };

  const fn = reduxFrame()(mockStore)(() => {});

  fn({
    type: frame('TEST'),
    interceptors: [interceptors.dispatch],
  });

  expect(mockStore.dispatch).toBeCalledWith({ type: 'TEST' });
});

describe('effect', () => {
  it('creates an interceptor that adds the effect key and args to context.effects', () => {
    const interceptor = effect('someEffectId', { someArg: 'someArgValue' });
    const context = {};
    const result = interceptor.after(context);
    expect(result.effects.someEffectId).toEqual({ someArg: 'someArgValue' });
  });
});

describe('mergeWithEffects', () => {
  it('merges the effect with effects', () => {
    const context = {
      effects: {
        someEffect: null,
      },
    };

    const result = mergeWithEffects(context, { newEffect: null });
    expect(result.effects).toEqual({
      newEffect: null,
      someEffect: null,
    });
  });
});

describe('mergeWithCoeffects', () => {
  it('merges the coeffect with coeffects', () => {
    const context = {
      coeffects: {
        someCoeffect: null,
      },
    };

    const result = mergeWithCoeffects(context, { newCoeffect: null });
    expect(result.coeffects).toEqual({
      newCoeffect: null,
      someCoeffect: null,
    });
  });
});

it('does the stack and queue in the right order', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({}),
  };

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
    },
  };

  const b = {
    before: () => {
      testStack.push('b');
      return undefined;
    },
    after: () => {
      testQueue.push('b');
      return undefined;
    },
  };

  const c = {
    before: () => {
      testStack.push('c');
      return undefined;
    },
    after: () => {
      testQueue.push('c');
      return undefined;
    },
  };

  const fn = reduxFrame()(mockStore)(() => {});

  fn({
    type: frame('TEST'),
    interceptors: [a, b, c],
  });

  expect(testStack).toEqual(['a', 'b', 'c']);
  expect(testQueue).toEqual(['c', 'b', 'a']);
});

it('calls registered coeffect handlers', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({}),
  };

  const fn = reduxFrame({
    coeffectHandlers: {
      testCoeffect: (coeffects, args) => `tested ${args.arg1} ${args.arg2}`,
    },
  })(mockStore)(() => {});

  const contextMap = fn({
    type: frame('TEST'),
    interceptors: [injectCoeffects('testCoeffect', { arg1: 'arg1', arg2: 'arg2' })],
  });

  expect(contextMap.coeffects.testCoeffect).toEqual('tested arg1 arg2');
});

it('calls registered coeffect handlers when there are multiple', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({}),
  };

  const fn = reduxFrame({
    coeffectHandlers: {
      testCoeffect: () => 'first coeffect',
      anotherCoeffect: () => 'another coeffect',
    },
  })(mockStore)(() => {});

  const contextMap = fn({
    type: frame('TEST'),
    interceptors: [injectCoeffects('testCoeffect'), injectCoeffects('anotherCoeffect')],
  });

  expect(contextMap.coeffects.testCoeffect).toEqual('first coeffect');
  expect(contextMap.coeffects.anotherCoeffect).toEqual('another coeffect');
});

it('calls registered effect handlers', () => {
  const testEffect = jest.fn();

  const mockStore = {
    dispatch: () => {},
    getState: () => ({}),
  };

  const fn = reduxFrame({
    effectHandlers: {
      testEffect,
    },
  })(mockStore)(() => {});

  fn({
    type: frame('TEST'),
    interceptors: [effect('testEffect', { testEffect: 'arg' })],
  });

  expect(testEffect).toBeCalled();
  const args = testEffect.mock.calls[0];
  expect(args[0]).toEqual({
    action: {
      type: 'TEST',
    },
    state: {},
  });
  expect(args[1]).toEqual({ testEffect: 'arg' });
  expect(args[2]).toBeInstanceOf(Function);
});

it('interceptors can enqueue additional interceptors', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({}),
  };

  const fn = reduxFrame()(mockStore)(() => {});

  const addToCoeffects = {
    before: context => mergeWithCoeffects(context, { test: 'value' }),
  };

  const addInterceptor = {
    before: context => enqueue(context, [addToCoeffects]),
  };

  const contextMap = fn({
    type: frame('TEST'),
    interceptors: [addInterceptor],
  });

  expect(contextMap.coeffects.test).toEqual('value');
});

it('enqueue adds interceptors to queue', () => {
  const context = {
    queue: [1, 2, 3],
  };

  const result = enqueue(context, [4, 5, 6]);

  expect(result.queue).toEqual([1, 2, 3, 4, 5, 6]);
});

describe('integration with Redux', () => {
  it('creates the right context map with all defaults', () => {
    function reducer(state = { tested: false }, action) {
      switch (action.type) {
      case 'TEST':
        return { ...state, tested: action.someKey };
      default:
        return state;
      }
    }

    const store = createStore(
      reducer,
      applyMiddleware(reduxFrame())
    );

    const contextMap = store.dispatch({
      type: frame('TEST'),
      someKey: 'tested',
    });

    expect(contextMap.coeffects).toEqual({
      action: {
        type: 'TEST',
        someKey: 'tested',
      },
      state: {
        tested: false,
      },
    });

    expect(contextMap.effects).toEqual({});
  });
});

describe('path', () => {
  it('moves value at `from` to `path`', () => {
    const context = {
      coeffects: {
        someCoeffect: 'test',
        action: {
          type: 'TEST',
        },
      },
    };

    const result = path({ from: 'someCoeffect', to: 'action.test' }).before(context);
    expect(result.coeffects.action).toEqual({
      type: 'TEST',
      test: 'test',
    });
  });

  it('can handle a nested to and from path with dotted string', () => {
    const context = {
      coeffects: {
        someCoeffect: {
          someNestedValue: 'test',
        },
        action: {
          type: 'TEST',
        },
      },
    };

    const result = path({ from: 'someCoeffect.someNestedValue', to: 'action.test.nestedKey' }).before(context);
    expect(result.coeffects.action).toEqual({
      type: 'TEST',
      test: {
        nestedKey: 'test',
      },
    });
  });

  it('can handle a nested to and from path with array', () => {
    const context = {
      coeffects: {
        someCoeffect: {
          someNestedValue: 'test',
        },
        action: {
          type: 'TEST',
        },
      },
    };

    const result = path({ from: ['someCoeffect', 'someNestedValue'], to: ['action', 'test', 'nestedKey'] }).before(context);
    expect(result.coeffects.action).toEqual({
      type: 'TEST',
      test: {
        nestedKey: 'test',
      },
    });
  });

  it('moves undefined to the `to` source if no `from` is provided', () => {
    const context = {
      coeffects: {
        someCoeffect: 'test',
        action: {
          type: 'TEST',
        },
      },
    };

    const result = path({ to: 'output' }).before(context);
    expect(result.coeffects).toEqual({
      someCoeffect: 'test',
      action: {
        type: 'TEST',
      },
      output: undefined,
    });
  });

  it('does nothing if the `to` source is not provided', () => {
    const context = {
      coeffects: {
        someCoeffect: 'test',
        action: {
          type: 'TEST',
        },
      },
    };

    const result = path({ from: 'someCoeffect' }).before(context);
    expect(result.coeffects).toEqual({
      someCoeffect: 'test',
      action: {
        type: 'TEST',
      },
    });
  });
});

it('passes the acion through when it is not framed', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({}),
  };

  const next = jest.fn();

  const fn = reduxFrame()(mockStore)(next);

  fn({
    type: 'TEST',
  });

  expect(next).toBeCalledWith({ type: 'TEST' });
});

describe('debug', () => {
  let oldLog = console.log;

  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = oldLog;
  });

  it('calls console.log with debug effect', () => {
    const mockStore = {
      dispatch: () => {},
      getState: () => ({}),
    };

    const fn = reduxFrame()(mockStore)(() => {});

    fn({
      type: frame('TEST'),
      interceptors: [interceptors.debug],
    });

    expect(console.log).toBeCalled();
    const args = console.log.mock.calls[0];
    expect(args[0]).toEqual('@@REDUX_FRAME/TEST');
    expect(Object.keys(args[1])).toEqual(['coeffects', 'effects', 'queue', 'stack', 'config']);
  });
});

it('can be configured with global interceptors that run on every action', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({}),
  };

  const addTest = {
    before: context => mergeWithCoeffects(context, { test: 'tested' }),
  };

  const fn = reduxFrame({
    globalInterceptors: [addTest],
  })(mockStore)(() => {});

  const contextMap = fn({
    type: frame('TEST'),
    interceptors: [],
  });

  expect(contextMap.coeffects.test).toEqual('tested');
});

it('a global interceptor can add more interceptors', () => {
  const mockStore = {
    dispatch: () => {},
    getState: () => ({}),
  };

  const addTest = {
    before: context => mergeWithCoeffects(context, { test: 'tested' }),
  };

  const modifyConfig = {
    before: context => enqueue(context, [addTest]),
  };

  const fn = reduxFrame({
    globalInterceptors: [],
  })(mockStore)(() => {});

  const contextMap = fn({
    type: frame('TEST'),
    interceptors: [modifyConfig],
  });

  expect(contextMap.coeffects.test).toEqual('tested');
});
