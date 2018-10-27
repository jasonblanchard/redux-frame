import objectPath from 'object-path';
import immutableObjectPath from 'object-path-immutable';

import { mergeWithCoeffects, mergeWithEffects } from './utils';

export function effect({ effectId, args }) {
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
        if (effectHandlers[effectId]) effectHandlers[effectId](context, context.effects[effectId], dispatch);
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
