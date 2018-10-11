import { FRAME_PREFIX } from './constants';

export function mergeWithEffects(context, effect) {
  return {
    ...context,
    effects: {
      ...context.effects,
      ...effect,
    },
  };
}

export function mergeWithCoeffects(context, coeffect) {
  return {
    ...context,
    coeffects: {
      ...context.coeffects,
      ...coeffect,
    },
  };
}

export function frame(type) {
  return `${FRAME_PREFIX}/${type}`;
}

export function enqueue(context, interceptors) {
  return {
    ...context,
    ...{ queue: [...context.queue, ...interceptors] },
  };
}
