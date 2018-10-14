export default {
  defaultsFromLocalStorage: (coeffects, args) => {
    const { key } = args;
    const data = localStorage.getItem(key) || '[]';
    return JSON.parse(data);
  },
};
