import { mergeWithCoeffects } from './redux-frame';

export default {
  addDefaultsToActionPayload: {
    before: context => mergeWithCoeffects(context, {
      action: {
        ...context.coeffects.action,
        stuff: context.coeffects.defaultsFromLocalStorage
      }
    })
  }
}
