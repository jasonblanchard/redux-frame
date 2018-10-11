export default {
  syncToLocalStorage: (coeffects, args) => {
    const { state, action } = coeffects;
    const { key } = args;
    const data = JSON.stringify([action.thing, ...state.stuff]);
    console.log(data);
    localStorage.setItem(key, data);
  },

  clearLocalStorage: () => {
    localStorage.clear();
  }
}
