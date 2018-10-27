import { path, doEffects } from '../src/interceptors';

describe('doEffects', () => {
  it('calls the effect handler', () => {
    const dispatch = () => {};
    const context = {
      coeffects: {},
      effects: {
        test: { arg1: 'arg1', arg2: 'arg2' },
      },
      queue: [],
      stack: [],
      config: {
        effectHandlers: {
          test: jest.fn(),
        },
      },
    };

    doEffects({ dispatch }).after(context);
    expect(context.config.effectHandlers.test).toBeCalled();
    const args = context.config.effectHandlers.test.mock.calls[0];
    expect(Object.keys(args[0])).toEqual([ 'coeffects', 'effects', 'queue', 'stack', 'config' ]);
    expect(args[1]).toEqual({ arg1: 'arg1', arg2: 'arg2' });
    expect(args[2]).toEqual(dispatch);
  });

  it('does nothing when there is no effect handler', () => {
    const dispatch = () => {};
    const context = {
      coeffects: {},
      effects: {},
      queue: [],
      stack: [],
      config: {
        effectHandlers: {
          test: jest.fn(),
        },
      },
    };

    doEffects({ dispatch }).after(context);
    expect(context.config.effectHandlers.test).not.toBeCalled();
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
    expect(result.coeffects).toEqual({
      someCoeffect: 'test',
      action: {
        type: 'TEST',
        test: 'test',
      },
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
    expect(result.coeffects).toEqual({
      someCoeffect: {
        someNestedValue: 'test',
      },
      action: {
        type: 'TEST',
        test: {
          nestedKey: 'test',
        },
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
    expect(result.coeffects).toEqual({
      someCoeffect: {
        someNestedValue: 'test',
      },
      action: {
        type: 'TEST',
        test: {
          nestedKey: 'test',
        },
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
