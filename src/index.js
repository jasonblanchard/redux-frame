const FRAME_PREFIX = '@@REDUX_FRAME';

export function frame(type) {
  return `${FRAME_PREFIX}/${type}`;
}

function isFrame(type) {
  // TODO: Use FRAME_PREFIX
  return /^@@REDUX_FRAME\//.test(type);
}

function stripFrame(type) {
  // TODO: Use FRAME_PREFIX
  return type.replace(/^@@REDUX_FRAME\//, '');
}

function createDoEffects(effectHandlers) {
  return {
    after: context => Object.keys(context.effects).forEach(effectKey => effectHandlers[effectKey](context.effects[effectKey]))
  }
}

export function mergeWithEffects(context, effects) {
  return {
    ...context,
    effects: {
      ...context.effects,
      ...effects
    }
  }
}

export function mergeWithCoeffects(context, coeffects) {
  return {
    ...context,
    coeffects: {
      ...context.coeffects,
      ...coeffects
    }
  }
}

export const reduxFrame = (config = { effectHandlers: {} }) => store => next => action => {
  if(isFrame(action.type)) {
    next(action);

    const { interceptors, type } = action;
    console.log(type, 'do frame stuff')

    const { effectHandlers } = config;
    effectHandlers.dispatch = action => store.dispatch(action)

    const dispatchInterceptor = {
      before: context => mergeWithEffects(context, { dispatch: {...action, ...{ type: stripFrame(action.type), interceptors: undefined } } })
    }

    const stateInterceptor = {
      before: context => mergeWithCoeffects(context, { state: store.getState() })
    }

    // Initialize context. This gets threaded through all interceptors.
    const context = {
      coeffects: {},
      effects: {},
      queue: [createDoEffects(effectHandlers), dispatchInterceptor, stateInterceptor, ...interceptors],
      stack: []
    }

    // Invoke functions in stack with context, return value is new context
    const updatedContext = context.queue.reduce((accum, interceptor) => {
      accum = interceptor.before ? interceptor.before(accum) || accum : accum;
      // Build up stack of interceptors we have already walked so we can execute their `after` functions later.
      accum.stack = [interceptor, ...accum.stack]
      return accum;
    }, context);

    console.log(context);

    // Invoke functions in stack with context
    updatedContext.stack
      .map(interceptor => interceptor.after)
      .filter(fn => !!fn)
      .forEach(fn => fn(updatedContext));

    return;
  }
  next(action);
  return;
}
