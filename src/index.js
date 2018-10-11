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

export function injectCoeffects(coeffectId, args) {
  return {
    id: 'indjectCoeffects',
    before: context => ({
      ...context,
      pendingCoeffectHandler: {
        coeffectId,
        args
      }
    })
  }
}

export function effect(effectId, args) {
  return {
    after: context => mergeWithEffects(context, { [effectId]: args})
  }
}

function createDoEffects(effectHandlers, dispatch) {
  return {
    id: 'doEffects',
    after: context => {
      Object.keys(context.effects).forEach(effectId => {
        if (effectHandlers[effectId]) effectHandlers[effectId](context.coeffects, context.effects[effectId], dispatch);
      })
    }
  }
}

export const interceptors = {
  dispatch: {
    id: 'dispatch',
    after: context => mergeWithEffects(context, { dispatch: null })
  },
  debug: {
    id: 'debug',
    after: context => mergeWithEffects(context, { debug: context })
  }
}

export function enqueue(context, interceptors) {
  return {
    ...context,
    ...{ queue: [...context.queue, ...interceptors] }
  }
}

function changeDirection(context) {
  return enqueue(context, context.stack);
}

function handleInjectedCoeffect(coeffectHandlers = {}, coeffectId, args) {
  return {
    id: 'handleInjectedCoeffect',
    before: context => {
      const result = coeffectHandlers[coeffectId] ? coeffectHandlers[coeffectId](context.coeffects, args) : null;
      return mergeWithCoeffects(context, { [coeffectId]: result });
    }
  }
}

// Putting context as last argument so we can partially apply the first two args with `bind`. Thanks, Javascript.
function invokeInterceptors(direction, coeffectHandlers, context, ) {
  const { queue } = context;
  if (queue.length === 0) {
    return context;
  }

  const [ interceptor, ...rest ] = queue;

  let updatedContext = {
    ...context,
    ...{ queue: rest },
    ...{ stack: [interceptor, ...context.stack]}
  };

  updatedContext = interceptor[direction] ? interceptor[direction](updatedContext) || updatedContext : updatedContext;

  if (updatedContext.pendingCoeffectHandler) {
    const { coeffectId, args } = updatedContext.pendingCoeffectHandler;
    updatedContext = enqueue(updatedContext, [handleInjectedCoeffect(coeffectHandlers, coeffectId, args)]);
    delete updatedContext.pendingCoeffectHandler;
  }

  return invokeInterceptors(direction, coeffectHandlers, updatedContext);
}

export const reduxFrame = (options = {}) => store => next => action => {
  if(isFrame(action.type)) {
    // Immediately send this wrapped action along through Redux. Mostly used for debugging
    next(action);

    const { interceptors = [], type } = action;

    const { effectHandlers = {}, coeffectHandlers = {} } = options;
    // Setup some built-in effect handlers.
    effectHandlers.dispatch = (coeffects) => store.dispatch(coeffects.action)
    effectHandlers.debug = (coeffects, context) => console.log(action.type, context);

    // Setup some built-in coeffect handlers.
    coeffectHandlers.state = coeffects => store.getState();

    // Initialize context. This gets threaded through all interceptors.
    const context = {
      coeffects: {
        action: normalizeFramedAction(action)
      },
      effects: {},
      queue: [createDoEffects(effectHandlers, store.dispatch), injectCoeffects('state'), ...interceptors],
      stack: []
    }

    // Need to pass around coeffectHandlers so that they can be invoked by handleInjectedCoeffect.
    // This is because we only know the coeffect handler map at reduxFrame() config time.
    // TODO: Consider a registration process at stores these in module scope so that they can be invoked directly by the caller. Same for effect handlers?
    return [
      invokeInterceptors.bind(null, 'before', coeffectHandlers),
      changeDirection,
      invokeInterceptors.bind(null, 'after', coeffectHandlers)
    ]
      .reduce((context, fn) => {
        return fn(context);
      }, context);
  }

  next(action);
  return;
}
