export default class PlaybackEngine {
  constructor(controller) {
    this.controller = controller;
    this.isBuffering = false;
    this.desiredState = 'suspended';
    this.tUiNext = null;
    this.tEngineNext = null;
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
    this.untick();

    // The logic tick: check bounds and buffering gracefully
    this._engineTick();

    // The UI tick: continuously update the visual slider as fast as the monitor allows, or strictly capped in Background
    this._uiTick();
  }

  _uiTick() {
    this.controller.fireEvent('timeupdate', {
      t: this.controller.currentTime,
      pct: this.controller.pct,
      remaining: this.controller.remaining,
      act: this.controller.ac.currentTime,
    });

    if (this.controller.ac.state === 'running' || this.isBuffering) {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        this.tUiNext = window.requestAnimationFrame(() => this._uiTick());
      } else {
        this.tUiNext = setTimeout(() => this._uiTick(), this.refreshRate);
      }
    }
  }

  _engineTick() {
    if (this.tEngineNext) clearTimeout(this.tEngineNext);
    this.tEngineNext = null;

    const t = this.controller.currentTime;

    if (t > this.controller.offset + this.controller.playDuration) {
      return this.controller.end();
    }

    const needsBuffering = this.controller.tracks.some((track) => !track.shouldAndCanPlay);

    if (needsBuffering && !this.isBuffering) {
      this.bufferingStart();
    } else if (!needsBuffering && this.isBuffering) {
      this.bufferingEnd();
    }

    // Determine when the engine should wake up next.
    if (this.controller.ac.state === 'running' || this.isBuffering) {
      let waitMs = 250;
      if (!this.isBuffering) {
        // calculate time until the end of the timeline
        let timeToNextCheck = this.controller.offset + this.controller.playDuration - t;

        // OR until the current ready segments end
        for (const track of this.controller.tracks) {
          const seg = track.stack.getAt(t);
          if (seg && seg.isReady) {
            const timeToSegEnd = seg.end - t;
            if (timeToSegEnd < timeToNextCheck) {
              timeToNextCheck = timeToSegEnd;
            }
          }
        }
        waitMs = timeToNextCheck * 1000 - 10;
      } else {
        // If buffering, poll reasonably fast to unpause immediately when data arrives
        waitMs = 100;
      }

      waitMs = Math.max(50, waitMs);
      this.tEngineNext = setTimeout(() => this._engineTick(), waitMs);
    }
  }

  untick() {
    if (this.tUiNext) {
      if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(this.tUiNext);
      }
      clearTimeout(this.tUiNext);
    }
    if (this.tEngineNext) clearTimeout(this.tEngineNext);

    this.tUiNext = null;
    this.tEngineNext = null;
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
