/* eslint-disable no-restricted-globals */
import Drawer from '../../vendor/wavesurfer/drawer.multicanvas.js';

const defaults = {
  audioContext: null,
  audioScriptProcessor: null,
  audioRate: 1,
  autoCenter: true,
  autoCenterRate: 5,
  autoCenterImmediately: false,
  backend: 'WebAudio',
  backgroundColor: null,
  barHeight: 1,
  barRadius: 0,
  barGap: null,
  barMinHeight: 1,
  container: null,
  cursorColor: 'transparent',
  cursorWidth: 0,
  dragSelection: true,
  drawingContextAttributes: {
    // Boolean that hints the user agent to reduce the latency
    // by desynchronizing the canvas paint cycle from the event
    // loop
    desynchronized: false,
  },
  duration: null,
  fillParent: true,
  forceDecode: false,
  height: 128,
  hideScrollbar: true,
  hideCursor: false,
  ignoreSilenceMode: false,
  interact: true,
  loopSelection: true,
  maxCanvasWidth: 4000,
  mediaContainer: null,
  mediaControls: false,
  mediaType: 'audio',
  minPxPerSec: 20,
  normalize: false,
  partialRender: false,
  pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
  plugins: [],
  progressColor: 'transparent',
  removeMediaElementOnDestroy: true,
  // renderer: MultiCanvas,
  responsive: false,
  rtl: false,
  scrollParent: false,
  skipLength: 2,
  splitChannels: false,
  splitChannelsOptions: {
    overlay: false,
    channelColors: {},
    filterChannels: [],
    relativeNormalization: false,
    splitDragSelection: false,
  },
  vertical: false,
  waveColor: '#999',
  xhr: {},
};

export default ({ container, params }) => {
  const config = { ...defaults, ...params };
  const drawer = new Drawer(container, config);

  drawer.drawPeaks = (data, duration) => {
    const nominalWidth = Math.round(
      duration * config.minPxPerSec * config.pixelRatio,
    );
    const parentWidth = drawer.getWidth();
    let width = nominalWidth;
    let start = 0;
    let end = Math.max(start + parentWidth, width);

    if (
      config.fillParent &&
      (!config.scrollParent || nominalWidth < parentWidth)
    ) {
      width = parentWidth;
      start = 0;
      end = width;
    }

    // const parentWidth = drawer.getWidth();
    // const start = 0;
    // const end = Math.max(start + parentWidth, width);

    return Drawer.prototype.drawPeaks.call(drawer, data, width, start, end);
  };

  return drawer;
};
