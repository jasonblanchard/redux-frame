import { path } from '../src/interceptors';

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
