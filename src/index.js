export const FRAME_PREFIX = '@@REDUX_FRAME';

export function frame(type) {
  return `${FRAME_PREFIX}/${type}`;
}

function isFrame(type) {
  const re = new RegExp('^' + FRAME_PREFIX + '\/');
  return re.test(type);
}

function stripFrame(type) {
  const re = new RegExp('^' + FRAME_PREFIX + '\/');
  return type.replace(re, '');
}

function normalizeFramedAction(action) {
  const normalizedAction = {...action, ...{ type: stripFrame(action.type)} }
  delete normalizedAction.interceptors;
  return normalizedAction;
}

export function mergeWithEffects(context, effect) {
  return {
    ...context,
    effects: {
      ...context.effects,
      ...effect
    }
  }
}

export function mergeWithCoeffects(context, coeffect) {
  return {
    ...context,
    coeffects: {
      ...context.coeffects,
      ...coeffect
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

function createDoEffects(effectHandlers) {
  return {
    after: context => {
      Object.keys(context.effects).forEach(effectId => {
        if (effectHandlers[effectId]) effectHandlers[effectId](context.coeffects, context.effects[effectId]);
      })
    }
  }
}

const forwardAction = {
  id: 'forwardAction',
  after: context => mergeWithEffects(context, { forwardAction: null })
}

export const reduxFrame = (options = {}) => store => next => action => {
  if(isFrame(action.type)) {
    // Immediately send this wrapped action along through Redux. Mostly used for debugging
    next(action);

    const { interceptors, type } = action;

    const { effectHandlers = {}, coeffectHandlers = {} } = options;
    // Setup some built-in effect handlers.
    effectHandlers.dispatch = (coeffects, action) => store.dispatch(action)
    effectHandlers.forwardAction = coeffects => store.dispatch(coeffects.action);
    coeffectHandlers.state = (coeffects, state) => state;

    // Initialize context. This gets threaded through all interceptors.
    const context = {
      coeffects: {
        action: normalizeFramedAction(action)
      },
      effects: {},
      queue: [createDoEffects(effectHandlers), injectCoeffects('state', store.getState()), forwardAction, ...interceptors],
      stack: []
    }

    // Invoke functions in stack with context, return value is new context
    // TODO: I think these need to be recursive function calls so that the stack can be modified by the handler
    const contextAfterBeforeHandlers = context.queue.reduce((updatedContext, interceptor) => {
      updatedContext = interceptor.before ? interceptor.before(updatedContext) || updatedContext : updatedContext;

      // Handle pending coeffect handler
      // TODO: Instead of handling this here, should it tack on an additional interceptor before moving on?
      if (updatedContext.pendingCoeffectHandler) {
        const { coeffectId, args } = updatedContext.pendingCoeffectHandler;
        if (coeffectHandlers[coeffectId]) updatedContext.coeffects[coeffectId] = coeffectHandlers[coeffectId](updatedContext.coeffects, ...args)
        delete updatedContext.pendingCoeffectHandler;
      }

      // Build up stack of interceptors we have already walked so we can execute their `after` functions later.
      updatedContext.stack = [interceptor, ...updatedContext.stack]
      return updatedContext;
    }, context);

    // Invoke stack of `after` handlers.
    const contextAfterAfterHandlers = contextAfterBeforeHandlers.stack.reduce((updatedContext, interceptor) => {
      updatedContext = interceptor.after ? interceptor.after(updatedContext) || updatedContext : updatedContext;
      return updatedContext;
    }, contextAfterBeforeHandlers);

    return contextAfterAfterHandlers;
  }

  next(action);
  return;
}
