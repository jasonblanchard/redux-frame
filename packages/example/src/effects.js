export default {
  syncToLocalStorage: (context, args) => {
    const { coeffects } = context;
    const { state, action } = coeffects;
    const { key } = args;
    const data = JSON.stringify([action.thing, ...state.stuff]);
    localStorage.setItem(key, data);
  },

  clearLocalStorage: () => {
    localStorage.clear();
  },
};
