import { enqueue } from './utils';
import { FRAME_PREFIX } from './constants';
import { injectCoeffects, doEffects } from './interceptors';

const removeKey = (key, { [key]: _, ...rest }) => rest; /* eslint-disable-line no-unused-vars */

function stripFrame(type) {
  const re = new RegExp('^' + FRAME_PREFIX + '/');
  return type.replace(re, '');
}

function normalizeFramedAction(action) {
  const normalizedAction = { ...action, ...{ type: stripFrame(action.type) } };
  delete normalizedAction.interceptors;
  return normalizedAction;
}

function isFrame(type) {
  const re = new RegExp('^' + FRAME_PREFIX + '/');
  return re.test(type);
}

function handleInjectedCoeffect(context, coeffectHandlers = {}) {
  let { coeffects } = context;
  const { pendingCoeffectHandler = {} } = coeffects;
  const { coeffectId, args } = pendingCoeffectHandler;

  if (coeffectId) {
    // TODO: Handle async coeffectHandlers
    const result = coeffectHandlers[coeffectId] ? coeffectHandlers[coeffectId](context.coeffects, args) : null;

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

  return context;
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

/**
 * Redux middlware that invokes the interceptor chain when the action.type is preffixed by FRAME_PREFIX. Add this to Redux with `applyMiddleware()`
 * @param {Object} options - key/value pairs of effectIds and effect handler functions.
 * @param {Object} options.effectHandlers - key/value pairs of effectIds and effect handler functions.
 * @param {Object} options.coeffectHandlers - key/value pairs of coeffectIds and coeffect handler functions.
 * @param {Object} options.globalInterceptors - Array of interceptors. These will run AFTER the built-in interceptors and BEFORE action.interceptors.
*/
const reFrame = (options = {}) => store => next => action => {
  if (isFrame(action.type)) {
    // Immediately send this wrapped action along through Redux. Mostly used for debugging
    next(action);

    const { interceptors = [] } = action;
    const { effectHandlers = {}, coeffectHandlers = {}, globalInterceptors = [] } = options;

    const config = {
      effectHandlers: {
        ...effectHandlers,
        dispatch: (coeffects, args, dispatch) => dispatch(coeffects.action),
        debug: (coeffects, context) => console.log(action.type, context), /* eslint-disable-line no-console */
      },
      coeffectHandlers: {
        ...coeffectHandlers,
        state: () => store.getState(),
        action: () => normalizeFramedAction(action),
      },
      globalInterceptors,
    };

    // Initialize context. This gets threaded through all interceptors.
    const context = {
      coeffects: {},
      effects: {},
      queue: [doEffects(store.dispatch), injectCoeffects('state'), injectCoeffects('action'), ...globalInterceptors, ...interceptors],
      stack: [],
      config,
    };

    return [
      invokeInterceptors.bind(null, 'before'),
      changeDirection,
      invokeInterceptors.bind(null, 'after'),
    ].reduce((context, fn) => fn(context), context);
  }

  next(action);
};

export default reFrame;
