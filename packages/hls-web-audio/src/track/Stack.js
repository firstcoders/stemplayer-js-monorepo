export default class {
  /**
   * @property {Array} elements - The ordered elements that jointly compose this HLS track
   * @private
   */
  elements = [];

  /**
   * @property {Number} startPointer - an internal pointer pointing to where the start of the next element is
   */
  startPointer;

  /**
   * @property {Number} startPointer - the initial start time, if not 0
   */
  initialStartTime;

  /**
   * @property {Number} nextMarginSeconds - a marin, in seconds, that controls a rolling window that checks whether a segment is nearly next
   */
  nextMarginSeconds;

  /**
   * @property {Number|undefined} - a duration set externally rather than derived from loaded audio
   */
  #duration;

  constructor({ start = 0, nextMarginSeconds = 5 } = {}) {
    this.initialStartTime = start;
    this.startPointer = start;
    this.nextMarginSeconds = nextMarginSeconds;
  }

  /**
   * Destructor
   */
  destroy() {
    // destroy all elements
    this.elements.forEach((element) => element.destroy());

    // remove references
    this.elements = [];
  }

  /**
   * Add elements to the stack
   *
   * @param  {...any} element
   */
  push(...element) {
    element.forEach((s) => {
      // initialise start time of element
      s.start = this.startPointer;

      // push to stack
      this.elements.push(s);

      // increment start pointer
      this.startPointer += s.duration;
    });
  }

  /**
   * Try to get the next element that is not ready
   * @returns {Object|undefined}
   */
  consume(timeframe) {
    const iCurrent = this.getIndexAt(timeframe.currentTime);
    const current = this.elements[iCurrent];
    const next = this.elements[iCurrent + 1];

    // Evict segment caches that are no longer physically required in the window
    this.#evictOldCaches(iCurrent);

    const getNextElement = () => {
      if (current && !current.$inTransit && !current.isReady) {
        return current;
      }

      // do not schedule next unless current is ready
      if (!current?.isReady) return undefined;

      // ensure the next is in the play window (<timeframe.end)
      if (next && next.start < timeframe.end && !next.$inTransit && !next.isReady) {
        return next;
      }

      return undefined;
    };

    const element = getNextElement();

    if (element) {
      // store a signpost that we're currently $inTransit the element
      // so that it wont be loaded again by the next timeupdate event, while it is still being prepared
      element.$inTransit = true;
    }

    return element;
  }

  /**
   * Ack an element, freeing it up for future consumption
   *
   * @param {Object} element
   */
  ack(element) {
    element.$inTransit = false;
  }

  /**
   * Cleans up audio buffers outside the nearby playback window to preserve memory
   * @param {Number} iCurrent - index of the currently playing element
   * @private
   */
  #evictOldCaches(iCurrent) {
    if (iCurrent === -1) return;

    // We only keep a window of ~5 segments (-2, +3 relative to current)
    for (let i = 0; i < this.elements.length; i += 1) {
      if (Math.abs(i - iCurrent) > 3) {
        if (this.elements[i].isLoaded && !this.elements[i].isReady) {
          this.elements[i].unloadCache();
        }
      }
    }
  }

  /**
   * The default duration as defined by the audio segments
   */
  get audioDuration() {
    return this.startPointer;
  }

  /**
   * Get the total duration
   *
   * @returns {Number|undefined}
   */
  get duration() {
    return this.#duration || this.audioDuration;
  }

  /**
   * Manually set the duration
   *
   * @param {Number} duration - the duration
   */
  set duration(duration) {
    this.#duration = duration;
  }

  /**
   * @returns {Object} The first element
   */
  get first() {
    return this.elements[0];
  }

  /**
   * Handles a controller's "seek" event
   */
  disconnectAll() {
    // disconnect all elements. A new set will need to be resheduled
    this.elements.forEach((element) => {
      // cancel any loading in progress
      element.cancel();

      // disconnect any connected audio nodes
      if (element.isReady) element.disconnect();

      // ensure element is again available for consumption
      this.ack(element);
    });
  }

  /**
   * Get the length of the stack
   */
  get length() {
    return this.elements.length;
  }

  /**
   * Cached last known index for quick retrieval
   * @private
   */
  #lastIdx = undefined;

  /**
   * Get the index of the current element using a cached fast path or binary search
   * @param {Number} t - the time
   * @returns {Number} the index
   */
  getIndexAt(t) {
    if (this.#lastIdx !== undefined && this.elements[this.#lastIdx]) {
      const s = this.elements[this.#lastIdx];
      // Fast path: still in same segment
      if (t >= s.start && t < s.end) return this.#lastIdx;

      // Fast path: advanced to next segment (most common during sequential playback)
      const next = this.elements[this.#lastIdx + 1];
      if (next && t >= next.start && t < next.end) {
        this.#lastIdx += 1;
        return this.#lastIdx;
      }
    }

    // Binary search for generic seeking
    let low = 0;
    let high = this.elements.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const s = this.elements[mid];

      if (t >= s.start && t <= s.end) {
        // Since segments are contiguous, end of one is start of next.
        // Let's resolve boundary overlap correctly (prefer left if exact start).
        if (t === s.start && mid > 0 && this.elements[mid - 1].end >= t) {
          this.#lastIdx = mid - 1;
          return mid - 1;
        }
        this.#lastIdx = mid;
        return mid;
      }

      if (t < s.start) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return -1;
  }

  /**
   * Get the current element
   * @param {Number} t - the time
   * @returns {Object|undefined}
   */
  getAt(t) {
    const idx = this.getIndexAt(t);
    return idx !== -1 ? this.elements[idx] : undefined;
  }

  /**
   * Recalculates the start times, taking into account any later adjustments from learning the real durations
   * of a segment after decoding the audio data.
   */
  recalculateStartTimes() {
    this.startPointer = this.initialStartTime;

    this.elements.forEach((s, i) => {
      const start = this.elements[i - 1]?.end || this.startPointer;

      // initialise start time of element
      s.start = start;

      // increment start pointer
      this.startPointer += s.duration;
    });
  }

  /**
   * @deprecated
   */
  set start(start) {
    this.initialStartTime = start;
    this.disconnectAll();
    this.recalculateStartTimes();
  }

  get start() {
    return this.initialStartTime;
  }

  set offset(offset) {
    this._offset = offset;
    this.disconnectAll();
  }

  get offset() {
    return this._offset;
  }
}
