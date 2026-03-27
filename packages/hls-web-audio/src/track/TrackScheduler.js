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

    const segments = this.getNextSegments(timeframe, currentIndex);
    if (!segments.length) return;

    // Immediately mark them as in-transit to prevent concurrent runSchedulePass calls
    // (triggered by rapid ticks) from picking up the same segments before the loop reaches them.
    for (const segment of segments) {
      segment.$inTransit = true;
    }

    for (const segment of segments) {
      // Re-check just in case they were ready'd or disconnected externally
      if (!segment.isReady) {
        await this.scheduleAt(timeframe, segment, currentIndex);
      } else {
        segment.$inTransit = false;
      }
    }
  }

  async scheduleAt(timeframe, segment, currentIndex) {
    try {
      this.track.controller?.notify('loading-start', this.track);
      // Let scheduleAt strictly rely on the caller setting it, but re-assert just in case
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
      this.stack.recalculateStartTimes(currentIndex);
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.track.controller?.notify('error', err);
      }
    } finally {
      segment.$inTransit = false;
      this.track.controller?.notify('loading-end', this.track);
    }
  }

  getNextSegments(timeframe, iCurrent) {
    if (iCurrent === -1) return [];

    const segments = [];
    const elements = this.stack.elements;

    // We want to fetch everything within the bounding box of current time + lookahead window (10s)
    // but constrain it strictly below the timeframe's intended boundary.
    const lookaheadWindow = timeframe.currentTime + 10;

    for (let i = iCurrent; i < elements.length; i++) {
      const segment = elements[i];
      if (!segment) continue;

      // Always allow the current index to load. For subsequent ones, restrict by lookahead window.
      if (i > iCurrent && segment.start > Math.min(lookaheadWindow, timeframe.end)) {
        break; // Stop looking once outside of the buffering window
      }

      if (!segment.$inTransit && !segment.isReady) {
        segments.push(segment);
      }
    }

    return segments;
  }

  evictOldCaches(iCurrent) {
    if (iCurrent === -1) return;

    // Fast O(1) sliding window eviction.
    // We only attempt to clean up bounds exactly slightly outside the target play window.
    const lookbehind = iCurrent - 4;
    const lookahead = iCurrent + 4;

    const evictQueue = [];
    if (this.stack.elements[lookbehind]) evictQueue.push(this.stack.elements[lookbehind]);
    if (this.stack.elements[lookahead]) evictQueue.push(this.stack.elements[lookahead]);

    evictQueue.forEach((segment) => {
      if (segment && segment.isLoaded && !segment.isReady) {
        segment.unloadCache();
      }
    });
  }
}
