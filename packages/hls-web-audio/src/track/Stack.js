export default class Stack {
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
   * @property {Number} initialStartTime - the initial start time, if not 0
   */
  initialStartTime;

  /**
   * @property {Number|undefined} - a duration set externally rather than derived from loaded audio
   */
  #duration;

  /**
   * Cached last known index for quick retrieval
   * @private
   */
  #lastIdx = undefined;

  constructor({ start = 0 } = {}) {
    this.initialStartTime = start;
    this.startPointer = start;
  }

  /**
   * Destructor
   */
  destroy() {
    this.elements.forEach((element) => element.destroy());
    this.elements = [];
  }

  /**
   * Add elements to the stack
   */
  push(...element) {
    element.forEach((s) => {
      s.start = this.startPointer;
      this.elements.push(s);
      this.startPointer += s.duration;
    });
  }

  /**
   * The default duration as defined by the audio segments
   */
  get audioDuration() {
    return this.startPointer;
  }

  /**
   * Get the total duration
   */
  get duration() {
    return this.#duration || this.audioDuration;
  }

  /**
   * Manually set the duration
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
   * Ack an element, freeing it up for future consumption
   *
   * @param {Object} element
   */
  ack(element) {
    element.$inTransit = false;
  }

  /**
   * Disconnects all active or loading elements
   */
  disconnectAll() {
    this.elements.forEach((element) => {
      if (element.cancel) element.cancel();
      if (element.isReady && element.disconnect) element.disconnect();
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
   * Recalculates the start times from a specific index forward, reducing total array loops
   */
  recalculateStartTimes(fromIndex = 0) {
    if (fromIndex === 0) {
      this.startPointer = this.initialStartTime;
    } else {
      this.startPointer = this.elements[fromIndex - 1]?.end || this.initialStartTime;
    }

    for (let i = fromIndex; i < this.elements.length; i += 1) {
      const s = this.elements[i];
      const start = this.elements[i - 1]?.end || this.startPointer;
      s.start = start;
      this.startPointer = start + s.duration;
    }
  }

  /**
   * @deprecated
   */
  set start(start) {
    this.initialStartTime = start;
    this.recalculateStartTimes();
  }

  get start() {
    return this.initialStartTime;
  }

  set offset(offset) {
    this._offset = offset;
  }

  get offset() {
    return this._offset;
  }
}
