import Controller from '../core/AudioController.js';
import Stack from './Stack.js';
import TrackScheduler from './TrackScheduler.js';

export default class Track {
  /**
   * @param {Object} param - The params
   * @param {Object} param.controller - The controller
   * @param {Object} param.volume - The initial volume
   */
  constructor({ controller, volume = 1, start = 0, duration = undefined } = {}) {
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

  get canPlay() {
    const current = this.stack.getAt(this.controller.currentTime);
    return current?.isReady;
  }

  get shouldAndCanPlay() {
    const current = this.stack.getAt(this.controller.currentTime);
    return !current || current?.isReady;
  }

  onTimeUpdate() {
    this.scheduler.runSchedulePass(this.controller.currentTimeframe);
  }

  async onSeek() {
    this.stack.disconnectAll(this.controller.currentTimeframe);
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
