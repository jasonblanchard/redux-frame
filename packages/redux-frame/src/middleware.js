import { FRAME_PREFIX } from './constants';
import { enqueue } from './utils';
import {
  doEffects,
  effect,
  injectCoeffects,
  path,
} from './interceptors';

function isFrame(type) {
  const re = new RegExp('^' + FRAME_PREFIX + '/');
  return re.test(type);
}

function stripFrame(type) {
  const re = new RegExp('^' + FRAME_PREFIX + '/');
  return type.replace(re, '');
}

function normalizeFramedAction(action) {
  const normalizedAction = { ...action, ...{ type: stripFrame(action.type) } };
  delete normalizedAction.interceptors;
  return normalizedAction;
}

const removeKey = (key, { [key]: _, ...rest }) => rest; /* eslint-disable-line no-unused-vars */

function handleInjectedCoeffect(context, coeffectHandlers = {}) {
  let { coeffects } = context;
  const { pendingCoeffectHandler = {} } = coeffects;
  const { coeffectId, args } = pendingCoeffectHandler;

  if (!coeffectId) return context;

  // TODO: Handle async coeffectHandlers
  const result = coeffectHandlers[coeffectId] ? coeffectHandlers[coeffectId](context, args) : null;

  let updatedCoeffects = { ...coeffects, ...{ [coeffectId]: result } };
  updatedCoeffects = removeKey('pendingCoeffectHandler', updatedCoeffects);

  const updatedContext = {
    ...context,
    ...{
      coeffects: updatedCoeffects,
    },
  };

  return updatedContext;
}

// Putting context as last argument so we can partially apply the first two args with `bind`. Thanks, Javascript.
function invokeInterceptors(direction, context) {
  const { queue } = context;
  if (queue.length === 0) {
    return context;
  }

  const [ interceptor, ...rest ] = queue;

  let updatedContext = {
    ...context,
    ...{ queue: rest },
    ...{ stack: [interceptor, ...context.stack] },
  };

  updatedContext = interceptor[direction] ? interceptor[direction](updatedContext) || updatedContext : updatedContext;

  if (updatedContext.coeffects.pendingCoeffectHandler) {
    updatedContext = handleInjectedCoeffect(updatedContext, context.config.coeffectHandlers);
  }

  return invokeInterceptors(direction, updatedContext);
}

function changeDirection(context) {
  const updatedContext = enqueue({ ...context, ...{ queue: [], stack: [] } }, context.stack);
  return updatedContext;
}

function resolveInterceptor(config, payload) {
  if (Array.isArray(payload)) return config.interceptors[payload[0]](payload[1]);
  return config.interceptors[payload];
}

/**
 * Redux middlware that invokes the interceptor chain when the action.type is preffixed by FRAME_PREFIX. Add this to Redux with `applyMiddleware()`
 * @param {Object} options - key/value pairs of effectIds and effect handler functions.
 * @param {Object} options.effectHandlers - key/value pairs of effectIds and effect handler functions.
 * @param {Object} options.coeffectHandlers - key/value pairs of coeffectIds and coeffect handler functions.
 * @param {Object} options.interceptors - key/value pairs of interceptorIds and interceptors. Interceptors may be interceptor objects (with an `id` and a `before` OR `after` function) or functions that return interceptor objects (i.e. interceptor factories). Interceptor factories should be added to the interceptor chain as an array where element 0 is the interceptorId and element 1 are args for the interceptor factory.
 * @param {Object} options.globalInterceptors - Array of interceptors. These will run AFTER the built-in interceptors and BEFORE action.interceptors.
*/
const reduxFrame = (options = {}) => store => next => action => {
  if (!isFrame(action.type)) return next(action);
  // Immediately send this wrapped action along through Redux. Mostly used for debugging
  next(action);

  const { interceptors: queuedInterceptors = [] } = action;
  const { effectHandlers = {}, coeffectHandlers = {}, interceptors = {}, onAllActions = [] } = options;

  // TODO: Export constants for built-in effect/coeffectHandlers
  const config = {
    effectHandlers: {
      ...effectHandlers,
      debug: (context) => console.log(action.type, context), /* eslint-disable-line no-console */
      dispatch: (context, args, dispatch) => dispatch(context.coeffects.action),
    },
    coeffectHandlers: {
      ...coeffectHandlers,
      action: () => normalizeFramedAction(action),
      state: () => store.getState(),
    },
    interceptors: {
      ...interceptors,
      doEffects,
      effect,
      injectCoeffects,
      path,
    },
    onAllActions,
  };

  const defaultInterceptors = [
    ['doEffects', { dispatch: store.dispatch }],
    ['injectCoeffects', { coeffectId: 'state' }],
    ['injectCoeffects', { coeffectId: 'action' }],
  ];

  const context = {
    coeffects: {},
    effects: {},
    queue: [...defaultInterceptors, ...onAllActions, ...queuedInterceptors].map(interceptorPayload => resolveInterceptor(config, interceptorPayload)),
    stack: [],
    config,
  };

  return [
    invokeInterceptors.bind(null, 'before'),
    changeDirection,
    invokeInterceptors.bind(null, 'after'),
  ].reduce((context, fn) => fn(context), context);
};

export default reduxFrame;
