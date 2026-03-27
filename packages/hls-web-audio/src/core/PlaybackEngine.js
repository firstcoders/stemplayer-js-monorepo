export default class PlaybackEngine {
  constructor(controller) {
    this.controller = controller;
    this.isBuffering = false;
    this.desiredState = 'suspended';
    this.tTick = null;
    this.refreshRate = controller.refreshRate || 250;
  }

  async play() {
    this.desiredState = 'resumed';

    if (typeof this.controller.duration !== 'number')
      throw new Error('Cannot play before loading content');
    if (this.isBuffering) throw new Error('The player is buffering');

    if (this.controller.ac.state === 'suspended') {
      await this.controller.ac.resume();
    }

    if (typeof this.controller.timeline.adjustedStart !== 'number') {
      this.controller.timeline.fixAdjustedStart(this.controller.offset);
    }

    this.controller.fireEvent('start');
  }

  async pause() {
    this.desiredState = 'suspended';
    if (this.controller.ac.state !== 'suspended') await this.controller.ac.suspend();
    this.controller.fireEvent('pause');
  }

  tick() {
    if (this.tTick) this.untick();

    if (this.controller.currentTime > this.controller.offset + this.controller.playDuration) {
      return this.controller.end();
    }

    const needsBuffering = this.controller.tracks.some((track) => !track.shouldAndCanPlay);

    if (needsBuffering && !this.isBuffering) {
      this.bufferingStart();
    } else if (!needsBuffering && this.isBuffering) {
      this.bufferingEnd();
    }

    this.controller.fireEvent('timeupdate', {
      t: this.controller.currentTime,
      pct: this.controller.pct,
      remaining: this.controller.remaining,
      act: this.controller.ac.currentTime,
    });

    if (this.controller.ac.state === 'running' || this.isBuffering) {
      this.tTick = setTimeout(() => this.tick(), this.refreshRate);
    }
  }

  untick() {
    if (this.tTick) clearTimeout(this.tTick);
    this.tTick = null;
  }

  bufferingStart() {
    this.controller.fireEvent('pause-start');
    this.isBuffering = true;
    if (this.controller.ac.state === 'running') this.controller.ac.suspend();
  }

  bufferingEnd() {
    if (this.desiredState === 'resumed') this.controller.ac.resume();
    this.isBuffering = false;
    this.controller.fireEvent('pause-end');
  }

  async reset() {
    await this.pause();
    this.controller.timeline.adjustedStart = undefined;
    this.desiredState = 'suspended';
  }
}
