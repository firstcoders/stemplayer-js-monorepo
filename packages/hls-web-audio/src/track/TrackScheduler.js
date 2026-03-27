export default class TrackScheduler {
  #scheduleNotBefore;

  constructor(track, stack) {
    this.track = track;
    this.stack = stack;
  }

  reset() {
    this.stack.disconnectAll();
    this.#scheduleNotBefore = undefined;
  }

  async runSchedulePass(timeframe, force) {
    if (force) this.#scheduleNotBefore = undefined;

    if (this.#scheduleNotBefore !== undefined && timeframe.currentTime < this.#scheduleNotBefore) {
      return;
    }

    const currentIndex = this.stack.getIndexAt(timeframe.currentTime);
    this.evictOldCaches(currentIndex);

    await this.scheduleAt(timeframe, currentIndex);
  }

  async scheduleAt(timeframe, currentIndex) {
    const segment = this.getNextSegment(timeframe, currentIndex);

    if (!segment) return;

    try {
      this.track.controller?.notify('loading-start', this.track);
      segment.$inTransit = true;

      // load the segment
      if (!segment.isLoaded) await segment.load().promise;

      const start = timeframe.calculateRealStart(segment);
      const offset = timeframe.calculateOffset(segment);
      const stop = timeframe.adjustedEnd;

      // connect it to the audio
      await segment.connect({
        ac: this.track.controller.ac,
        destination: this.track.gainNode,
        start,
        offset,
        stop,
      });

      this.#scheduleNotBefore = segment.end - segment.duration / 2;
      this.stack.recalculateStartTimes();
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.track.controller?.notify('error', err);
      }
    } finally {
      segment.$inTransit = false;
      this.track.controller?.notify('loading-end', this.track);
    }
  }

  getNextSegment(timeframe, iCurrent) {
    if (iCurrent === -1) return undefined;

    const current = this.stack.elements[iCurrent];
    const next = this.stack.elements[iCurrent + 1];

    if (current && !current.$inTransit && !current.isReady) {
      return current;
    }

    if (!current?.isReady) return undefined;

    if (next && next.start < timeframe.end && !next.$inTransit && !next.isReady) {
      return next;
    }

    return undefined;
  }

  evictOldCaches(iCurrent) {
    if (iCurrent === -1) return;

    for (let i = 0; i < this.stack.elements.length; i += 1) {
      if (Math.abs(i - iCurrent) > 3) {
        if (this.stack.elements[i].isLoaded && !this.stack.elements[i].isReady) {
          this.stack.elements[i].unloadCache();
        }
      }
    }
  }
}
