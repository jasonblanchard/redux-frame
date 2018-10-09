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

function normalizeFramedAction(action) {
  const normalizedAction = {...action, ...{ type: stripFrame(action.type)} }
  delete normalizedAction.interceptors;
  return normalizedAction;
}

function createDoEffects(effectHandlers) {
  return {
    after: context => Object.keys(context.effects).forEach(effectId => effectHandlers[effectId](context.coeffects, context.effects[effectId]))
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

export function injectCoeffects(coeffectId, args) {
  return {
    before: context => mergeWithCoeffects(context, { [coeffectId]: args })
  }
}

function createDoInjectCoeffects(coeffectHandlers) {
  return {
    before: context => mergeWithCoeffects(
      context,
      Object.keys(context.coeffects).reduce((accum, coeffectId) => {
        if (coeffectHandlers[coeffectId]) accum[coeffectId] = coeffectHandlers[coeffectId](context.coeffects, context.coeffects[coeffectId])
        return accum;
      }, {})
    )
  }
}

const dispatchOriginalActionInterceptor = {
  before: context => mergeWithEffects(context, { dispatch: context.coeffects.action })
}

export const reduxFrame = (config = { effectHandlers: {}, coeffectHandlers: {} }) => store => next => action => {
  if(isFrame(action.type)) {
    next(action);

    const { interceptors, type } = action;
    console.log(type, 'do frame stuff')

    const { effectHandlers, coeffectHandlers } = config;
    effectHandlers.dispatch = (coeffects, action) => store.dispatch(action)
    coeffectHandlers.state = (coeffects, state) => state;

    // Initialize context. This gets threaded through all interceptors.
    const context = {
      coeffects: {
        action: normalizeFramedAction(action)
      },
      effects: {},
      queue: [createDoEffects(effectHandlers), injectCoeffects('state', store.getState()), dispatchOriginalActionInterceptor, createDoInjectCoeffects(coeffectHandlers), ...interceptors],
      stack: []
    }

    // Invoke functions in stack with context, return value is new context
    const contextAfterBeforeHandlers = context.queue.reduce((accum, interceptor) => {
      accum = interceptor.before ? interceptor.before(accum) || accum : accum;
      // Build up stack of interceptors we have already walked so we can execute their `after` functions later.
      accum.stack = [interceptor, ...accum.stack]
      return accum;
    }, context);

    console.log(context);

    // Invoke functions in stack with context
    // TODO: I think this should build up context with `after` calls, too?
    contextAfterBeforeHandlers.stack
      .map(interceptor => interceptor.after)
      .filter(fn => !!fn)
      .forEach(fn => fn(contextAfterBeforeHandlers));

    return;
  }
  next(action);
  return;
}
