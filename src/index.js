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

export function injectCoeffects(coeffectId, ...args) {
  return {
    before: context => ({
      ...context,
      pendingCoeffectHandler: {
        coeffectId,
        args
      }
    })
  }
}

const dispatchOriginalActionInterceptor = {
  before: context => mergeWithEffects(context, { dispatch: context.coeffects.action })
}

export const reduxFrame = (config = { effectHandlers: {}, coeffectHandlers: {} }) => store => next => action => {
  if(isFrame(action.type)) {
    // Immediately forward the original action along through Redux. Mostly used for debugging
    next(action);

    const { interceptors, type } = action;

    const { effectHandlers, coeffectHandlers } = config;
    // Setup some default effect handlers.
    effectHandlers.dispatch = (coeffects, action) => store.dispatch(action)
    coeffectHandlers.state = (coeffects, state) => state;

    // Initialize context. This gets threaded through all interceptors.
    const context = {
      coeffects: {
        action: normalizeFramedAction(action)
      },
      effects: {},
      queue: [createDoEffects(effectHandlers), injectCoeffects('state', store.getState()), dispatchOriginalActionInterceptor, ...interceptors],
      stack: []
    }

    // Invoke functions in stack with context, return value is new context
    const contextAfterBeforeHandlers = context.queue.reduce((context, interceptor) => {
      context = interceptor.before ? interceptor.before(context) || context : context;

      // Handle pending coeffect handler
      // TODO: Instead of handling this here, should it tack on an additional interceptor before moving on?
      if (context.pendingCoeffectHandler) {
        const { coeffectId, args } = context.pendingCoeffectHandler;
        context.coeffects[coeffectId] = coeffectHandlers[coeffectId](context.coeffects, ...args)
        delete context.pendingCoeffectHandler;
      }

      // Build up stack of interceptors we have already walked so we can execute their `after` functions later.
      context.stack = [interceptor, ...context.stack]
      return context;
    }, context);

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
