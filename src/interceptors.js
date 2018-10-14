import objectPath from 'object-path';
import immutableObjectPath from 'object-path-immutable';

import { mergeWithEffects, mergeWithCoeffects } from './utils';

/**
 * Interceptor that dispatches the action stored in context.coeffects.action.
*/
const dispatch = {
  id: 'dispatch',
  after: context => mergeWithEffects(context, { dispatch: null }),
};

/**
 * Interceptor that logs the context with console.log().
*/
const debug = {
  id: 'debug',
  after: context => mergeWithEffects(context, { debug: context }),
};

export default {
  dispatch,
  debug,
};

/**
 * Interceptor factory that creates an interceptor that merges the effectId and args into context.effects.
 * @param {string} - effectId
 * @param {object} - key value pair arguments
*/
export function effect(effectId, args) {
  return {
    id: effectId,
    after: context => mergeWithEffects(context, { [effectId]: args }),
  };
}

/**
 * Interceptor factory that creates an interceptor that merges the result of the coeffect handler named coeffectId into context.coeffects under the coeffectId key.
 * @param {string} - coeffectId
 * @param {object} - key value pair arguments
*/
export function injectCoeffects(coeffectId, args) {
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

/**
 * Interceptor factory that creates an interceptor that merges the value at coeffects[from] into coeffects[to].
 * Useful if you want to tack on the result from a previous coeffect handler on to the action before dispatching it so that you can access that data in your reducers.
 * @param {Object} args - key/value argument pairs.
 * @param {(string)} args.from - source path you want to merge elsewhere. Can express a deep path with dot-separated path string.
 * @param {(string[])} args.from - source path you want to merge elsewhere. Can express a deep path with array of keys.
 * @param {string} args.to - destination path. Can express a deep path with dot-separated path string.
 * @param {string[]} args.to - destination path.Can express a deep path with array of keys.
*/
export function path(args = {}) {
  // TODO: Let this be a deep path
  return {
    before: context => {
      const { coeffects } = context;
      const { from = '_', to } = args;
      const coeffect = objectPath.get(coeffects, from);

      return to ? mergeWithCoeffects(context, (immutableObjectPath.set(coeffects, to, coeffect))) : context;
    },
  };
}

export function doEffects(dispatch) {
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
