import createDrawer from './createDrawer';

const createContainer = () => {
  const container = document.createElement('div');
  container.style.setProperty('width', '1000px');
  container.style.setProperty('height', '75px');
  container.style.setProperty('position', 'absolute');
  container.style.setProperty('left', '10px');
  container.style.setProperty('top', '10px');
  container.style.setProperty('background-color', 'black');
  // container.style.setProperty('display', 'none');
  return container;
};

export default (peaks) => {
  const container = createContainer();
  document.body.appendChild(container);

  const drawer = createDrawer({
    container,
    params: {
      barGap: 1,
      barWidth: 1,
      height: 75,
      normalize: true,
      pixelRatio: 3,
      waveColor: 'white',
      cursorWidth: 0,
      dragSelection: false,
      // responsive: true,
    },
  });

  drawer.init();

  drawer.drawPeaks(peaks.data);
  const p = drawer.canvases[0].wave.toDataURL('image/png');

  setTimeout(() => {
    console.log(p);
  }, 100);

  // console.log(p);

  // drawer.destroy();
  // container.remove();

  return p;
};
