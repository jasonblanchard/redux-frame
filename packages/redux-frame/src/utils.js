import { FRAME_PREFIX } from './constants';

/**
 * Merge effect with context.effects.
 * @param {object} - context map
 * @param {object} - key value pair of effect handler name as they key and args as the value.
*/
export function mergeWithEffects(context, effect) {
  return {
    ...context,
    effects: {
      ...context.effects,
      ...effect,
    },
  };
}

/**
 * Merge effect with context.coeffects.
 * @param {object} - context map
 * @param {object} - key value pair of coeffect handler name as they key and args as the value.
*/
export function mergeWithCoeffects(context, coeffect) {
  return {
    ...context,
    coeffects: {
      ...context.coeffects,
      ...coeffect,
    },
  };
}

/**
 * Add FRAME_PREFIX to action type.
 * This tells reduxFrame that this is an action that should be handled by the middleware.
 * Actions that don't have this prefix are passed through the rest of the configured Redux middleware stack.
 * @param {string} - action type.
*/
export function frame(type) {
  return `${FRAME_PREFIX}/${type}`;
}

export function enqueue(context, interceptors) {
  return {
    ...context,
    ...{ queue: [...context.queue, ...interceptors] },
  };
}
