const removeKey = (key, {[key]: _, ...rest}) => rest;

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
    id: 'injectCoeffects',
    before: context => mergeWithCoeffects(context, {
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

const dispatch = {
  id: 'dispatch',
  after: context => mergeWithEffects(context, { dispatch: null })
};

const debug = {
  id: 'debug',
  after: context => mergeWithEffects(context, { debug: context })
}

export const interceptors = {
  dispatch,
  debug
}

export function enqueue(context, interceptors) {
  return {
    ...context,
    ...{ queue: [...context.queue, ...interceptors] }
  }
}

function changeDirection(context) {
  const updatedContext = enqueue({ ...context, ...{ queue: [], stack: [] } }, context.stack);
  return updatedContext;
}

function handleInjectedCoeffect(context, coeffectHandlers = {}) {
  let { coeffects } = context;
  const { pendingCoeffectHandler = {} } = coeffects;
  const { coeffectId, args } = pendingCoeffectHandler;

  if (coeffectId) {
    // TODO: Handle async coeffectHandlers
    const result = coeffectHandlers[coeffectId] ? coeffectHandlers[coeffectId](context.coeffects, args) : null;

    let updatedCoeffects = {...coeffects, ...{ [coeffectId]: result }};
    updatedCoeffects = removeKey('pendingCoeffectHandler', updatedCoeffects);

    const updatedContext = {
      ...context,
      ...{
        coeffects: updatedCoeffects
      }
    }

    return updatedContext;
  }

  return context;
}

// Putting context as last argument so we can partially apply the first two args with `bind`. Thanks, Javascript.
function invokeInterceptors(direction, config, context) {
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

  if (updatedContext.coeffects.pendingCoeffectHandler) {
    updatedContext = handleInjectedCoeffect(updatedContext, config.coeffectHandlers)
  }

  return invokeInterceptors(direction, config, updatedContext);
}

export const reduxFrame = (options = {}) => store => next => action => {
  if(isFrame(action.type)) {
    // Immediately send this wrapped action along through Redux. Mostly used for debugging
    next(action);

    const { interceptors = [], type } = action;

    const { effectHandlers = {}, coeffectHandlers = {} } = options;
    // Setup some built-in effect handlers.
    // effectHandlers.dispatch = (coeffects) => store.dispatch(coeffects.action)
    // effectHandlers.debug = (coeffects, context) => console.log(action.type, context);

    // Setup some built-in coeffect handlers.
    // coeffectHandlers.state = coeffects => store.getState();

    const config = {
      effectHandlers: {
        ...effectHandlers,
        ...{
          dispatch: (coeffects) => store.dispatch(coeffects.action),
          debug: (coeffects, context) => console.log(action.type, context)
        }
      },
      coeffectHandlers: {
        ...coeffectHandlers,
        ...{
          state: coeffects => store.getState()
        }
      }
    }

    // Initialize context. This gets threaded through all interceptors.
    const context = {
      coeffects: {
        action: normalizeFramedAction(action)
      },
      effects: {},
      queue: [createDoEffects(config.effectHandlers, store.dispatch), injectCoeffects('state'), ...interceptors],
      stack: []
    }

    // Need to pass around config so that the coeffectHandlers can be invoked by handleInjectedCoeffect.
    // This is because we only know the coeffect handler map at reduxFrame() config time.
    return [
      invokeInterceptors.bind(null, 'before', config),
      changeDirection,
      invokeInterceptors.bind(null, 'after', config)
    ]
      .reduce((context, fn) => {
        return fn(context);
      }, context);
  }

  next(action);
  return;
}
