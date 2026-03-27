import Controller from '../core/AudioController.js';
import Segment from '../io/AudioSegment.js';
import Stack from './Stack.js';
import ManifestLoader from '../io/ManifestLoader.js';
import TrackScheduler from './TrackScheduler.js';

export default class HLS {
  /**
   * @param {Object} param - The params
   * @param {Object} param.controller - The controller
   * @param {Object} param.volume - The initial volume
   * @param {Object} param.fetchOptions - Options to use when fetching the hls/m3u8
   */
  constructor({
    controller,
    volume = 1,
    fetch = null,
    fetchOptions = {},
    start = 0,
    duration = undefined,
  } = {}) {
    this.controller = controller || new Controller();

    this.controller.observe(this);

    this.eTimeUpdate = this.controller.on('timeupdate', () => this.onTimeUpdate());
    this.eSeek = this.controller.on('seek', () => this.onSeek());
    this.ePlayDuration = this.controller.on('playDuration', () => this.#reset());
    this.eOffset = this.controller.on('offset', () => this.#reset());

    this.gainNode = this.controller.ac.createGain();
    this.gainNode.connect(this.controller.gainNode);
    this.volume = volume;

    this.stack = new Stack({ start });
    this.scheduler = new TrackScheduler(this, this.stack);
    this.manifestLoader = new ManifestLoader(fetch);

    this.fetchOptions = fetchOptions;
    this.start = start;
    this.duration = duration;
  }

  set start(start) {
    this.stack.start = parseFloat(start);
    this.controller?.notify('start', this);
  }

  get start() {
    return this.stack.start;
  }

  #reset() {
    this.scheduler.reset();
  }

  destroy() {
    this.cancel?.();

    this.controller.unobserve(this);
    this.controller = null;

    this.eTimeUpdate.un();
    this.eOffset.un();
    this.ePlayDuration.un();
    this.eSeek.un();

    this.stack.destroy();
    this.stack = null;
  }

  load(src) {
    this.src = src;

    const loadHandle = this.manifestLoader.load(src, {
      ...this.fetchOptions,
      headers: {
        Accept: 'application/x-mpegURL, application/vnd.apple.mpegurl',
        ...this.fetchOptions?.headers,
      },
    });

    this.cancel = loadHandle.cancel;

    const promise = loadHandle.promise
      .then((sources) => {
        this.buildSegments(sources);
        this.controller?.notify('init', this);
        return sources;
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        this.controller?.notify('error', error);
        throw error;
      });

    return { promise, cancel: this.cancel };
  }

  loadFromM3u8(manifest, src) {
    const sources = ManifestLoader.parse(manifest, src);
    this.buildSegments(sources);
  }

  buildSegments(sources) {
    this.stack?.push(
      ...sources.map((source) => new Segment({ ...source, fetchOptions: this.fetchOptions })),
    );
  }

  set duration(duration) {
    this.stack.duration = duration;
    this.controller?.notify('duration', this);
  }

  get duration() {
    return this.stack.duration;
  }

  get totalDuration() {
    return this.stack.totalDuration;
  }

  get end() {
    return this.stack.duration + this.stack.start;
  }

  onTimeUpdate() {
    this.scheduler.runSchedulePass(this.controller.currentTimeframe);
  }

  async onSeek() {
    this.stack.disconnectAll();
    // Use force = true
    this.scheduler.runSchedulePass(this.controller.currentTimeframe, true);
  }

  async runSchedulePass(force) {
    return this.scheduler.runSchedulePass(this.controller.currentTimeframe, force);
  }

  get volume() {
    return this.gainNode.gain.value;
  }

  set volume(value) {
    this.gainNode.gain.value = value;
  }
}
