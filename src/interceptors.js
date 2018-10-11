import { mergeWithEffects, mergeWithCoeffects } from './utils';

const dispatch = {
  id: 'dispatch',
  after: context => mergeWithEffects(context, { dispatch: null }),
};

const debug = {
  id: 'debug',
  after: context => mergeWithEffects(context, { debug: context }),
};

export default {
  dispatch,
  debug,
};

export function effect(effectId, args) {
  return {
    after: context => mergeWithEffects(context, { [effectId]: args }),
  };
}

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

// Is this worth it?
export function coeffectToAction(args = {}) {
  // TODO: Let this be a deep path
  return {
    before: context => {
      const { coeffects } = context;
      const { action = {} } = coeffects;
      const { from, spread = false } = args;
      const coeffect = coeffects[from];
      const to = args.to || from;

      const updatedAction = spread ? { ...action, ...coeffect } : { ...action, [to]: coeffect };

      return mergeWithCoeffects(context, {
        action: updatedAction,
      });
    },
  };
}

export function doEffects(effectHandlers, dispatch) {
  return {
    id: 'doEffects',
    after: context => {
      Object.keys(context.effects).forEach(effectId => {
        if (effectHandlers[effectId]) effectHandlers[effectId](context.coeffects, context.effects[effectId], dispatch);
      });
    },
  };
}
