import objectPath from 'object-path';
import immutableObjectPath from 'object-path-immutable';

import { mergeWithCoeffects, mergeWithEffects } from './utils';

// TODO: Is it worth exporting constants for each of these?

/**
 * Interceptor factory that creates an interceptor that merges the effectId and args into context.effects.
 * @example
 * // In your interceptor chain:
 * ['effect', { effectId: 'someEffectHandler' args: { arg1: 'arg1' } }]
 * // When the interceptors are run, this will invoke your effect handler:
 * someEffectHandler(context, { arg1: 'arg1' }, dispatch)
 * @param {string} - effectId
 * @param {object} - key value pair arguments
*/
export function effect({ effectId, args }) {
  return {
    id: 'effect',
    before: context => mergeWithEffects(context, { [effectId]: args }),
  };
}

/**
 * Interceptor factory that creates an interceptor that merges the result of the coeffect handler named coeffectId into context.coeffects under the coeffectId key.
 * @example
 * // In your interceptor chain:
 * ['injectCoeffects', { coeffectId: 'someCoeffectHandler' args: { arg1: 'arg1' } }]
 * // When the interceptors are run, this will invoke your effect handler:
 * someCoeffectHandler(context, { arg1: 'arg1' })
 * @param {string} - coeffectId
 * @param {object} - key value pair arguments
*/
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

/**
 * Interceptor factory that creates an interceptor that merges the value at coeffects[from] into coeffects[to].
 * Useful if you want to tack on the result from a previous coeffect handler on to the action before dispatching it so that you can access that data in your reducers.
 * @example
 * // In your interceptor chain:
 * ['path', { from: 'some.from.path', to: 'some.to.path' }]
 * @param {Object} args - key/value argument pairs.
 * @param {(string)} args.from - source path you want to merge elsewhere. Can express a deep path with dot-separated path string.
 * @param {(string[])} args.from - source path you want to merge elsewhere. Can express a deep path with array of keys.
 * @param {string} args.to - destination path. Can express a deep path with dot-separated path string.
 * @param {string[]} args.to - destination path.Can express a deep path with array of keys.
*/
export function path(args = {}) {
  return {
    before: context => {
      const { coeffects } = context;
      const { from, to } = args;
      const coeffect = from ? objectPath.get(coeffects, from) : undefined;

      return to ? mergeWithCoeffects(context, (immutableObjectPath.set(coeffects, to, coeffect))) : context;
    },
  };
}

export function doEffects({ dispatch }) {
  return {
    id: 'doEffects',
    after: context => {
      const { effectHandlers } = context.config;
      Object.keys(context.effects).forEach(effectId => {
        if (effectHandlers[effectId]) effectHandlers[effectId](context, context.effects[effectId], dispatch);
        // TODO: Warn?
      });
    },
  };
}
