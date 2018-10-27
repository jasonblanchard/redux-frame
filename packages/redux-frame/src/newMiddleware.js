import { FRAME_PREFIX } from './constants';
import { enqueue, mergeWithCoeffects, mergeWithEffects } from './utils';

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

function resolveInterceptor(config, payload) {
  if (Array.isArray(payload)) return config.interceptors[payload[0]](payload[1]);
  return config.interceptors[payload];
}

// Interceptors, TODO: Move
function coeffect({ key, data }) {
  return {
    name: 'coeffect',
    before: context => mergeWithCoeffects(context, { [key]: data }),
  };
}

function effect({ effectId, args }) {
  return {
    name: 'effect',
    before: context => mergeWithEffects(context, { [effectId]: args }),
  };
}

export function doEffects({ dispatch }) {
  return {
    id: 'doEffects',
    after: context => {
      const { effectHandlers } = context.config;
      Object.keys(context.effects).forEach(effectId => {
        if (effectHandlers[effectId]) effectHandlers[effectId](context.coeffects, context.effects[effectId], dispatch);
      });
    },
  };
}

export function injectCoeffects({ coeffectId, args }) {
  return {
    id: 'injectCoeffects',
    before: context => mergeWithCoeffects(context, {
      pendingCoeffectHandler: {
        coeffectId,
        args,
      },
    }),
  };
}

export default (options = {}) => store => next => action => {
  if (!isFrame(action.type)) return next(action);

  const { interceptors: queuedInterceptors = [] } = action;
  const { effectHandlers = {}, coeffectHandlers = {}, interceptors = {}, onAllActions = [] } = options;

  const config = {
    effectHandlers: {
      ...effectHandlers,
      dispatch: (coeffects, args, dispatch) => dispatch(coeffects.action),
      // debug: (coeffects, context) => console.log(action.type, context), /* eslint-disable-line no-console */
    },
    coeffectHandlers: {
      ...coeffectHandlers,
      state: () => store.getState(),
    },
    interceptors: {
      ...interceptors,
      coeffect,
      effect,
      doEffects,
      injectCoeffects,
    },
    onAllActions,
  };

  const defaultInterceptors = [
    ['doEffects', { dispatch: store.dispatch }],
    ['effect', { effectId: 'dispatch' }],
    ['injectCoeffects', { coeffectId: 'state' }],
    ['coeffect', { key: 'action', data: normalizeFramedAction(action) }],
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
