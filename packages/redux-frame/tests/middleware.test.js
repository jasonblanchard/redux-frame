/* eslint-disable no-console */
import { frame } from '../src';
import { mergeWithCoeffects } from '../src/utils';
import middleware from '../src/middleware';

describe('middleware function', () => {
  it('with defaults', () => {
    const mockStore = {
      dispatch: () => {},
      getState: () => ({ counter: 1 }),
    };
    const mockNext = () => {};
    const action = { type: frame('TEST') };

    const contextMap = middleware()(mockStore)(mockNext)(action);

    const { coeffects, effects, queue, stack } = contextMap;
    expect(coeffects).toEqual({
      state: { counter: 1 },
      action: { type: 'TEST' },
    });
    expect(effects).toEqual({
      dispatch: undefined,
    });
    expect(queue.length).toEqual(0);
    expect(stack.length > 0).toEqual(true);
  });

  it('with dispatch', () => {
    const dispatch = jest.fn();

    const mockStore = {
      dispatch: dispatch,
      getState: () => ({ counter: 1 }),
    };
    const mockNext = () => {};
    const action = {
      type: frame('TEST'),
      interceptors: [
        ['effect', { effectId: 'dispatch' }],
      ],
    };

    middleware()(mockStore)(mockNext)(action);

    expect(dispatch).toBeCalledWith({ type: 'TEST' });
  });

  it('with additional coeffect handlers', () => {
    const mockStore = {
      dispatch: () => {},
      getState: () => ({}),
    };
    const mockNext = () => {};
    const config = {
      coeffectHandlers: {
        test: () => 'tested',
      },
    };
    const action = {
      type: frame('TEST'),
      interceptors: [['injectCoeffects', { coeffectId: 'test' }]],
    };

    const contextMap = middleware(config)(mockStore)(mockNext)(action);
    expect(contextMap.coeffects.test).toEqual('tested');
  });

  it('with additional affect handlers', () => {
    const dispatch = () => {};
    const mockStore = {
      dispatch,
      getState: () => ({}),
    };
    const testFn = jest.fn();
    const mockNext = () => {};
    const config = {
      effectHandlers: {
        test: testFn,
      },
    };
    const action = {
      type: frame('TEST'),
      interceptors: [['effect', { effectId: 'test', args: { arg1: 'arg1', arg2: 'arg2' } }]],
    };

    middleware(config)(mockStore)(mockNext)(action);
    expect(testFn).toBeCalled();
  });

  it('with simple interceptor', () => {
    const mockStore = {
      dispatch: () => {},
      getState: () => ({}),
    };
    const mockNext = () => {};
    const config = {
      interceptors: {
        test: {
          id: 'test',
          before: context => mergeWithCoeffects(context, { test: 'tested' }),
        },
      },
    };
    const action = {
      type: frame('TEST'),
      interceptors: ['test'],
    };

    const contextMap = middleware(config)(mockStore)(mockNext)(action);
    expect(contextMap.coeffects.test).toEqual('tested');
  });

  describe('debug', () => {
    let oldLog = console.log;

    beforeEach(() => {
      console.log = jest.fn();
    });

    afterEach(() => {
      console.log = oldLog;
    });

    it('works', () => {
      const mockStore = {
        dispatch: () => {},
        getState: () => ({}),
      };
      const mockNext = () => {};
      const action = {
        type: frame('TEST'),
        interceptors: [['effect', { effectId: 'debug' }]],
      };

      middleware()(mockStore)(mockNext)(action);

      expect(console.log).toBeCalled();
      const args = console.log.mock.calls[0];
      expect(args[0]).toEqual('@@REDUX_FRAME/TEST');
      expect(Object.keys(args[1])).toEqual(['coeffects', 'effects', 'queue', 'stack', 'config']);
    });
  });
});
