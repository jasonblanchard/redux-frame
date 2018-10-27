export default {
  defaultsFromLocalStorage: (context, args) => {
    const { key } = args;
    const data = localStorage.getItem(key) || '[]';
    return JSON.parse(data);
  },
};
