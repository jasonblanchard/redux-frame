import { frame } from '../src';

import middleware from '../src/newMiddleware';

describe('middleware function', () => {
  it('works with defaults', () => {
    const dispatch = jest.fn();

    const mockStore = {
      dispatch: dispatch,
      getState: () => ({ counter: 1 }),
    };
    const mockNext = () => {};
    const action = { type: frame('TEST') };

    const contextMap = middleware()(mockStore)(mockNext)(action);

    // console.log(contextMap);
    expect(dispatch).toBeCalledWith({ type: 'TEST' });
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
});
