import { enqueue } from './utils';
import { FRAME_PREFIX } from './constants';
import { injectCoeffects, doEffects } from './interceptors';

export const removeKey = (key, { [key]: _, ...rest }) => rest; /* eslint-disable-line no-unused-vars */

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
function invokeInterceptors(direction, config, context) {
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
    updatedContext = handleInjectedCoeffect(updatedContext, config.coeffectHandlers);
  }

  return invokeInterceptors(direction, config, updatedContext);
}

function changeDirection(context) {
  const updatedContext = enqueue({ ...context, ...{ queue: [], stack: [] } }, context.stack);
  return updatedContext;
}

export default (options = {}) => store => next => action => {
  if (isFrame(action.type)) {
    // Immediately send this wrapped action along through Redux. Mostly used for debugging
    next(action);

    const { interceptors = [] } = action;
    const { effectHandlers = {}, coeffectHandlers = {} } = options;

    const config = {
      effectHandlers: {
        ...effectHandlers,
        ...{
          dispatch: (coeffects) => store.dispatch(coeffects.action),
          debug: (coeffects, context) => console.log(action.type, context), /* eslint-disable-line no-console */
        },
      },
      coeffectHandlers: {
        ...coeffectHandlers,
        ...{
          state: () => store.getState(),
        },
      },
    };

    // Initialize context. This gets threaded through all interceptors.
    const context = {
      coeffects: {
        action: normalizeFramedAction(action),
      },
      effects: {},
      queue: [doEffects(config.effectHandlers, store.dispatch), injectCoeffects('state'), ...interceptors],
      stack: [],
    };

    // Need to pass around config so that the coeffectHandlers can be invoked by handleInjectedCoeffect.
    // This is because we only know the coeffect handler map at reduxFrame() config time.
    return [
      invokeInterceptors.bind(null, 'before', config),
      changeDirection,
      invokeInterceptors.bind(null, 'after', config),
    ].reduce((context, fn) => fn(context), context);
  }

  next(action);
};
