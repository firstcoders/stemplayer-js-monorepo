export default arr => {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  return arr.map(val => (val - min) / (max - min));
};
